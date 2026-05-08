import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationType } from '../../database/entities/enums';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendPromoDto } from './dto/send-promo.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ───────────── QUERY ─────────────

  async findMyNotifications(
    userId: string,
    query: NotificationsQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    const qb = this.notifRepo
      .createQueryBuilder('n')
      .where('n.userId = :uid', { uid: userId });

    if (query.type) {
      qb.andWhere('n.type = :t', { t: query.type });
    }
    if (query.unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    qb.orderBy('n.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, query.page, query.limit);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notifRepo.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  // ───────────── MARK READ ─────────────

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new NotFoundException('Bildirishnoma topilmadi');
    }
    if (!notif.isRead) {
      notif.isRead = true;
      await this.notifRepo.save(notif);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
  }

  // ───────────── DELETE ─────────────

  async remove(userId: string, notificationId: string): Promise<void> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new NotFoundException('Bildirishnoma topilmadi');
    }
    await this.notifRepo.remove(notif);
  }

  async clearAll(userId: string): Promise<void> {
    await this.notifRepo.delete({ userId });
  }

  // ───────────── CREATE (internal use) ─────────────

  /**
   * Bitta foydalanuvchiga bildirishnoma yaratish.
   * Boshqa modullardan chaqiriladi.
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? {},
      isRead: false,
    });
    const saved = await this.notifRepo.save(notif);
    this.logger.log(
      `Bildirishnoma: user=${dto.userId} type=${dto.type} title="${dto.title}"`,
    );
    return saved;
  }

  /**
   * Buyurtma statusi o'zgarganda — buyer'ga xabar.
   */
  async notifyOrderStatus(
    userId: string,
    orderNumber: string,
    newStatus: string,
    orderId: string,
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      confirmed: 'tasdiqlandi',
      processing: 'tayyorlanmoqda',
      shipped: "jo'natildi",
      delivered: 'yetkazildi',
      cancelled: 'bekor qilindi',
      refunded: 'qaytarildi',
    };
    const label = statusLabels[newStatus] ?? newStatus;

    await this.create({
      userId,
      type: NotificationType.ORDER_STATUS,
      title: `Buyurtma ${label}`,
      body: `Sizning ${orderNumber} raqamli buyurtmangiz ${label}.`,
      data: { orderId, status: newStatus },
    });
  }

  /**
   * Seller'ga yangi sharh haqida xabar.
   */
  async notifyNewReview(
    sellerId: string,
    productName: string,
    rating: number,
    reviewId: string,
    productId: string,
  ): Promise<void> {
    await this.create({
      userId: sellerId,
      type: NotificationType.REVIEW,
      title: 'Yangi sharh',
      body: `"${productName}" mahsulotiga ${rating} yulduzli sharh yozildi.`,
      data: { reviewId, productId, rating },
    });
  }

  /**
   * Seller'ga yangi buyurtma haqida xabar.
   */
  async notifyNewOrder(
    sellerId: string,
    orderNumber: string,
    orderId: string,
    itemCount: number,
  ): Promise<void> {
    await this.create({
      userId: sellerId,
      type: NotificationType.ORDER_STATUS,
      title: 'Yangi buyurtma',
      body: `${orderNumber} — ${itemCount} ta mahsulot. Tasdiqlashni kutmoqda.`,
      data: { orderId },
    });
  }

  // ───────────── PROMO (admin) ─────────────

  async sendPromo(dto: SendPromoDto): Promise<{ sent: number }> {
    let userIds: string[];

    if (dto.userIds && dto.userIds.length > 0) {
      userIds = dto.userIds;
    } else {
      // Barcha aktiv foydalanuvchilarga
      const users = await this.userRepo.find({
        where: { isActive: true },
        select: ['id'],
      });
      userIds = users.map((u) => u.id);
    }

    const notifications = userIds.map((uid) =>
      this.notifRepo.create({
        userId: uid,
        type: NotificationType.PROMO,
        title: dto.title,
        body: dto.body,
        data: dto.data ?? {},
        isRead: false,
      }),
    );

    // Batch insert — 500 tadan
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      await this.notifRepo.save(notifications.slice(i, i + batchSize));
    }

    this.logger.log(`Promo yuborildi: ${userIds.length} foydalanuvchiga`);
    return { sent: userIds.length };
  }
}
