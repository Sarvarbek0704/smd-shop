import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from '../../database/entities/chat-message.entity';
import { JwtPayload } from '../auth/token.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // userId → socketId set
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new WsException('Token kerak');
      }

      const secret = this.configService.getOrThrow<string>('jwt.accessSecret');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      client.userId = payload.sub;

      // Online users tracking
      if (!this.onlineUsers.has(payload.sub)) {
        this.onlineUsers.set(payload.sub, new Set());
      }
      this.onlineUsers.get(payload.sub)!.add(client.id);

      this.server.emit('user_online', { userId: payload.sub });
      this.logger.log(`Client connected: ${payload.sub} (${client.id})`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
          this.server.emit('user_offline', { userId: client.userId });
        }
      }
      this.logger.log(`Client disconnected: ${client.userId} (${client.id})`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) throw new WsException('Avtorizatsiya kerak');

    const room = await this.chatService.getRoomById(data.roomId);
    if (!room) throw new WsException('Xona topilmadi');
    if (!this.chatService.isRoomParticipant(room, client.userId)) {
      throw new WsException("Ruxsat yo'q");
    }

    await client.join(`room:${data.roomId}`);
    this.logger.log(`User ${client.userId} joined room ${data.roomId}`);

    return { event: 'room_joined', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await client.leave(`room:${data.roomId}`);
    return { event: 'room_left', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { roomId: string; content: string; type?: MessageType },
  ) {
    if (!client.userId) throw new WsException('Avtorizatsiya kerak');

    if (!data.content || data.content.trim().length === 0) {
      throw new WsException("Xabar bo'sh bo'lishi mumkin emas");
    }

    const message = await this.chatService.sendMessage(
      client.userId,
      data.roomId,
      data.content.trim(),
      data.type ?? MessageType.TEXT,
    );

    // Xonaga broadcast (yuboruvchi ham oladi — u o'zi filtr qilsin)
    this.server.to(`room:${data.roomId}`).emit('new_message', message);

    return { event: 'message_sent', data: message };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageId?: string },
  ) {
    if (!client.userId) throw new WsException('Avtorizatsiya kerak');

    if (data.messageId) {
      await this.chatService.markMessageRead(client.userId, data.messageId);
      this.server.to(`room:${data.roomId}`).emit('message_read', {
        messageId: data.messageId,
        readAt: new Date(),
        readBy: client.userId,
      });
    } else {
      const result = await this.chatService.markAsRead(
        client.userId,
        data.roomId,
      );
      this.server.to(`room:${data.roomId}`).emit('messages_read', {
        roomId: data.roomId,
        readBy: client.userId,
        count: result.marked,
      });
    }

    return { event: 'read_acknowledged' };
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;
    client
      .to(`room:${data.roomId}`)
      .emit('user_typing', { userId: client.userId, roomId: data.roomId });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;
    client.to(`room:${data.roomId}`).emit('user_stop_typing', {
      userId: client.userId,
      roomId: data.roomId,
    });
  }

  // ───────── HELPERS ─────────

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}
