import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ChatRoom } from '../../database/entities/chat-room.entity';
import {
  ChatMessage,
  MessageType,
} from '../../database/entities/chat-message.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductStatus } from '../../database/entities/enums';
import { CreateRoomDto } from './dto/create-room.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom) private readonly roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ───────── ROOMS ─────────

  async getOrCreateRoom(userId: string, dto: CreateRoomDto): Promise<ChatRoom> {
    // Mahsulot tekshiruvi
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    if (product.sellerId !== dto.sellerId) {
      throw new BadRequestException('Seller va mahsulot mos emas');
    }
    if (userId === dto.sellerId) {
      throw new BadRequestException("O'z mahsulotingizga chat ochib bo'lmaydi");
    }

    // Mavjud xona bormi
    let room = await this.roomRepo.findOne({
      where: {
        productId: dto.productId,
        buyerId: userId,
        sellerId: dto.sellerId,
      },
    });

    if (!room) {
      room = await this.roomRepo.save(
        this.roomRepo.create({
          productId: dto.productId,
          buyerId: userId,
          sellerId: dto.sellerId,
        }),
      );
    }

    return this.getRoomFull(room.id);
  }

  async getMyRooms(userId: string) {
    const rooms = await this.roomRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .leftJoin('r.buyer', 'buyer')
      .addSelect([
        'buyer.id',
        'buyer.firstName',
        'buyer.lastName',
        'buyer.avatarUrl',
      ])
      .leftJoin('r.seller', 'seller')
      .addSelect([
        'seller.id',
        'seller.firstName',
        'seller.lastName',
        'seller.avatarUrl',
      ])
      .where('r.buyerId = :uid OR r.sellerId = :uid', { uid: userId })
      .orderBy('r.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('r.createdAt', 'DESC')
      .getMany();

    // Har bir xona uchun oxirgi xabar va o'qilmaganlar soni
    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await this.messageRepo.findOne({
          where: { roomId: room.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messageRepo.count({
          where: {
            roomId: room.id,
            isRead: false,
            senderId: userId === room.buyerId ? room.sellerId : room.buyerId,
          },
        });

        return {
          ...room,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content:
                  lastMessage.messageType === MessageType.IMAGE
                    ? '📷 Rasm'
                    : lastMessage.content.slice(0, 100),
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return enriched;
  }

  async getRoomFull(roomId: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['product', 'product.images', 'buyer', 'seller'],
    });
    if (!room) {
      throw new NotFoundException('Chat xonasi topilmadi');
    }
    return room;
  }

  // ───────── MESSAGES ─────────

  async sendMessage(
    senderId: string,
    roomId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<ChatMessage> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Chat xonasi topilmadi');
    }

    // Faqat room'dagi ishtirokchilar yoza oladi
    if (room.buyerId !== senderId && room.sellerId !== senderId) {
      throw new ForbiddenException("Bu chat xonasiga ruxsat yo'q");
    }

    const message = await this.messageRepo.save(
      this.messageRepo.create({
        roomId,
        senderId,
        content,
        messageType: type,
        isRead: false,
      }),
    );

    // lastMessageAt yangilash
    await this.roomRepo.update(roomId, { lastMessageAt: new Date() });

    // Sender bilan birga qaytarish
    return this.messageRepo.findOne({
      where: { id: message.id },
      relations: ['sender'],
    }) as Promise<ChatMessage>;
  }

  async getMessages(
    userId: string,
    roomId: string,
    query: MessagesQueryDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Chat xonasi topilmadi');
    }
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Bu chat xonasiga ruxsat yo'q");
    }

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoin('m.sender', 's')
      .addSelect(['s.id', 's.firstName', 's.lastName', 's.avatarUrl'])
      .where('m.roomId = :rid', { rid: roomId });

    if (query.before) {
      qb.andWhere('m.id < :before', { before: query.before });
    }

    qb.orderBy('m.createdAt', 'DESC').take(query.limit);

    const [items, total] = await qb.getManyAndCount();

    // Teskari tartibga qaytarish (eng eski tepada)
    items.reverse();

    return buildPaginated(items, total, query.page, query.limit);
  }

  // ───────── READ ─────────

  async markAsRead(
    userId: string,
    roomId: string,
  ): Promise<{ marked: number }> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Chat xonasi topilmadi');
    }
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Ruxsat yo'q");
    }

    // Faqat boshqa tomonning xabarlarini o'qilgan deb belgilaymiz
    const otherUserId = userId === room.buyerId ? room.sellerId : room.buyerId;

    const result = await this.messageRepo.update(
      { roomId, senderId: otherUserId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { marked: result.affected ?? 0 };
  }

  async markMessageRead(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['room'],
    });
    if (!message) {
      throw new NotFoundException('Xabar topilmadi');
    }
    if (message.room.buyerId !== userId && message.room.sellerId !== userId) {
      throw new ForbiddenException("Ruxsat yo'q");
    }
    // O'zi yuborgan xabarni o'qilgan qilmaslik
    if (message.senderId === userId) return;

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await this.messageRepo.save(message);
    }
  }

  // ───────── ACCESS CHECK ─────────

  isRoomParticipant(room: ChatRoom, userId: string): boolean {
    return room.buyerId === userId || room.sellerId === userId;
  }

  async getRoomById(roomId: string): Promise<ChatRoom | null> {
    return this.roomRepo.findOne({ where: { id: roomId } });
  }

  async getTotalUnread(userId: string): Promise<{ unreadCount: number }> {
    const rooms = await this.roomRepo.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      select: ['id', 'buyerId', 'sellerId'],
    });

    let total = 0;
    for (const room of rooms) {
      const otherUserId =
        userId === room.buyerId ? room.sellerId : room.buyerId;
      const count = await this.messageRepo.count({
        where: { roomId: room.id, senderId: otherUserId, isRead: false },
      });
      total += count;
    }

    return { unreadCount: total };
  }
}
