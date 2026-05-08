import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Delivery } from '../../database/entities/delivery.entity';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';
import {
  DeliveryStatus,
  OrderStatus,
  RoleName,
} from '../../database/entities/enums';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveriesQueryDto } from './dto/deliveries-query.dto';
import { canDeliveryTransition } from './delivery-transitions';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────── CREATE (buyurtma shipped bo'lganda) ─────────────

  async createForOrder(orderId: string): Promise<Delivery> {
    const existing = await this.deliveryRepo.findOne({
      where: { orderId },
    });
    if (existing) {
      return existing;
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['seller'],
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    const delivery = this.deliveryRepo.create({
      orderId,
      status: DeliveryStatus.WAITING,
      pickupAddress: {}, // seller'dan olinadi (keyinroq seller profilda manzil bo'ladi)
      deliveryAddress: order.shippingAddress,
      notes: null,
    });

    return this.deliveryRepo.save(delivery);
  }

  // ───────────── ASSIGN COURIER ─────────────

  async assignCourier(
    deliveryId: string,
    dto: AssignCourierDto,
  ): Promise<Delivery> {
    const delivery = await this.findByIdOrFail(deliveryId);

    // Faqat waiting yoki failed (qayta tayinlash) holatda
    if (
      delivery.status !== DeliveryStatus.WAITING &&
      delivery.status !== DeliveryStatus.FAILED
    ) {
      throw new BadRequestException(
        `"${delivery.status}" holatida kuryer tayinlab bo'lmaydi`,
      );
    }

    // Kuryer tekshiruvi
    const courier = await this.userRepo.findOne({
      where: { id: dto.courierId },
      relations: ['roles'],
    });
    if (!courier) {
      throw new NotFoundException('Kuryer topilmadi');
    }
    if (!courier.roles.some((r) => r.name === RoleName.DELIVERY)) {
      throw new BadRequestException('Bu foydalanuvchi kuryer emas');
    }
    if (!courier.isActive) {
      throw new BadRequestException('Kuryer bloklangan');
    }

    delivery.courierId = dto.courierId;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.notes = dto.notes ?? delivery.notes;
    await this.deliveryRepo.save(delivery);

    // Kuryer'ga xabar
    const order = await this.orderRepo.findOne({
      where: { id: delivery.orderId },
    });
    if (order) {
      await this.notificationsService
        .create({
          userId: dto.courierId,
          type: 'order_status' as any,
          title: 'Yangi yetkazma',
          body: `${order.orderNumber} raqamli buyurtmani yetkazish sizga tayinlandi.`,
          data: { orderId: delivery.orderId, deliveryId },
        })
        .catch(() => {});
    }

    return this.findByIdFull(deliveryId);
  }

  // ───────────── UPDATE STATUS ─────────────

  async updateStatus(
    deliveryId: string,
    dto: UpdateDeliveryStatusDto,
    user: AuthUser,
  ): Promise<Delivery> {
    const delivery = await this.findByIdOrFail(deliveryId);

    // Kuryer faqat o'ziga tayinlangan yetkazmani yangilaydi
    if (
      user.roles.includes(RoleName.DELIVERY) &&
      !user.roles.includes(RoleName.ADMIN)
    ) {
      if (delivery.courierId !== user.id) {
        throw new ForbiddenException('Bu yetkazma sizga tayinlanmagan');
      }
    }

    if (!canDeliveryTransition(delivery.status, dto.status)) {
      throw new BadRequestException(
        `"${delivery.status}" holatidan "${dto.status}" holatiga o'tish mumkin emas`,
      );
    }

    delivery.status = dto.status;
    if (dto.notes) {
      delivery.notes = dto.notes;
    }

    // Yetkazilganda timestamp belgilash
    if (dto.status === DeliveryStatus.DELIVERED) {
      delivery.deliveredAt = new Date();
      // Buyurtma statusini ham delivered qilish
      await this.ordersService
        .updateStatus(
          delivery.orderId,
          OrderStatus.DELIVERED,
          user.id,
          'Kuryer yetkazdi',
        )
        .catch((err) =>
          this.logger.error(
            `Order status update xatosi: ${(err as Error).message}`,
          ),
        );
    }

    await this.deliveryRepo.save(delivery);

    // Buyer'ga xabar
    const order = await this.orderRepo.findOne({
      where: { id: delivery.orderId },
    });
    if (order) {
      const statusLabels: Record<string, string> = {
        picked_up: 'Kuryer buyurtmani oldi',
        on_the_way: "Buyurtma yo'lda",
        delivered: 'Buyurtma yetkazildi',
        failed: 'Yetkazishda muammo',
      };
      const label = statusLabels[dto.status];
      if (label) {
        await this.notificationsService
          .notifyOrderStatus(
            order.buyerId,
            order.orderNumber,
            dto.status,
            order.id,
          )
          .catch(() => {});
      }
    }

    return this.findByIdFull(deliveryId);
  }

  // ───────────── QUERIES ─────────────

  async findAll(query: DeliveriesQueryDto): Promise<PaginatedResult<Delivery>> {
    const qb = this.deliveryRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.order', 'o')
      .leftJoin('d.courier', 'c')
      .addSelect(['c.id', 'c.firstName', 'c.lastName', 'c.phone'])
      .leftJoin('o.buyer', 'buyer')
      .addSelect([
        'buyer.id',
        'buyer.firstName',
        'buyer.lastName',
        'buyer.phone',
      ]);

    if (query.status) {
      qb.andWhere('d.status = :st', { st: query.status });
    }
    if (query.courierId) {
      qb.andWhere('d.courierId = :cid', { cid: query.courierId });
    }

    qb.orderBy('d.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, query.page, query.limit);
  }

  async findMyCourier(
    courierId: string,
    query: DeliveriesQueryDto,
  ): Promise<PaginatedResult<Delivery>> {
    return this.findAll({ ...query, courierId });
  }

  async findByOrderId(orderId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({
      where: { orderId },
      relations: ['courier', 'order'],
    });
    if (!delivery) {
      throw new NotFoundException('Yetkazma topilmadi');
    }
    return delivery;
  }

  async findByIdFull(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
      relations: ['courier', 'order', 'order.buyer'],
    });
    if (!delivery) {
      throw new NotFoundException('Yetkazma topilmadi');
    }
    return delivery;
  }

  // ───────────── ESTIMATED TIME ─────────────

  async setEstimatedTime(
    deliveryId: string,
    estimatedAt: string,
  ): Promise<Delivery> {
    const delivery = await this.findByIdOrFail(deliveryId);
    delivery.estimatedAt = new Date(estimatedAt);
    await this.deliveryRepo.save(delivery);
    return this.findByIdFull(deliveryId);
  }

  // ───────────── HELPERS ─────────────

  private async findByIdOrFail(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) {
      throw new NotFoundException('Yetkazma topilmadi');
    }
    return delivery;
  }
}
