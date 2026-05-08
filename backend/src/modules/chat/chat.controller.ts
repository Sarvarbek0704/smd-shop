import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Mening chat xonalarim' })
  getMyRooms(@CurrentUser() user: AuthUser) {
    return this.chatService.getMyRooms(user.id);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Chat xonasi ochish / mavjudini olish' })
  createRoom(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.chatService.getOrCreateRoom(user.id, dto);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Xona tafsilotlari' })
  getRoom(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.getRoomFull(id);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Xabarlar tarixi (pagination)' })
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chatService.getMessages(user.id, id, query);
  }

  @Patch('rooms/:id/read')
  @ApiOperation({
    summary: "Xonadagi barcha xabarlarni o'qilgan deb belgilash",
  })
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.markAsRead(user.id, id);
  }

  @Get('unread')
  @ApiOperation({ summary: "Barcha xonalardagi o'qilmagan xabarlar soni" })
  totalUnread(@CurrentUser() user: AuthUser) {
    return this.chatService.getTotalUnread(user.id);
  }
}
