import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { SendPromoDto } from './dto/send-promo.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mening bildirishnomalarim' })
  findMy(@CurrentUser() user: AuthUser, @Query() query: NotificationsQueryDto) {
    return this.notificationsService.findMyNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: "O'qilmagan bildirishnomalar soni" })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Bildirishnomani o'qilgan deb belgilash" })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Hammasini o'qilgan deb belgilash" })
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Bildirishnomani o'chirish" })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.remove(user.id, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Barcha bildirishnomalarni tozalash' })
  async clearAll(@CurrentUser() user: AuthUser) {
    await this.notificationsService.clearAll(user.id);
  }

  // ───────── Admin ─────────

  @Post('promo')
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: "Promo bildirishnoma yuborish (aniq user'larga yoki hammaga)",
  })
  sendPromo(@Body() dto: SendPromoDto) {
    return this.notificationsService.sendPromo(dto);
  }
}
