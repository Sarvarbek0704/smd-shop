import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderStatusHistory } from '../../database/entities/order-status-history.entity';
import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { Coupon } from '../../database/entities/coupon.entity';
import {
  CouponType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  RoleName,
} from '../../database/entities/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { generateOrderNumber } from '../../common/utils/order-number.util';
import { canTransition, buyerCanCancel } from './order-transitions';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryService } from '../delivery/delivery.service';
import { Delivery } from '../../database/entities/delivery.entity';
import { DeliveryStatus } from '../../database/entities/enums';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Coupon) private readonly couponRepo: Repository<Coupon>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  // ───────────────── CHECKOUT ─────────────────

  async checkout(userId: string, dto: CreateOrderDto): Promise<Order[]> {
    const cart = await this.cartRepo.findOne({ where: { userId } });
    if (!cart) {
      throw new BadRequestException("Savatingiz bo'sh");
    }

    const cartItems = await this.cartItemRepo.find({
      where: { cartId: cart.id },
      relations: ['product', 'product.images', 'variant'],
    });
    if (cartItems.length === 0) {
      throw new BadRequestException("Savatingiz bo'sh");
    }

    // Validatsiya: barcha mahsulotlar aktiv va zaxirada bormi
    for (const item of cartItems) {
      if (item.product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(
          `"${item.product.name}" hozirda sotuvda emas. Savatdan olib tashlang.`,
        );
      }
      if (item.variant) {
        if (!item.variant.isActive) {
          throw new BadRequestException(
            `"${item.product.name}" — "${item.variant.name}" varianti noaktiv`,
          );
        }
        if (item.variant.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `"${item.product.name}" — "${item.variant.name}": zaxirada faqat ${item.variant.stockQuantity} ta qolgan`,
          );
        }
      }
    }

    // Seller bo'yicha guruhlash — har bir seller uchun alohida buyurtma
    const sellerGroups = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const sid = item.product.sellerId;
      if (!sellerGroups.has(sid)) {
        sellerGroups.set(sid, []);
      }
      sellerGroups.get(sid)!.push(item);
    }

    // Umumiy buyurtma summasi — kupon minOrderAmount tekshiruvi uchun
    let grandTotal = 0;
    for (const item of cartItems) {
      const basePrice = parseFloat(item.product.basePrice);
      const discountPrice = item.product.discountPrice
        ? parseFloat(item.product.discountPrice)
        : null;
      const isDiscountActive =
        discountPrice !== null &&
        (!item.product.discountEndsAt ||
          new Date(item.product.discountEndsAt) > new Date());
      const effectivePrice = isDiscountActive ? discountPrice! : basePrice;
      const variantMod = item.variant ? parseFloat(item.variant.priceModifier) : 0;
      grandTotal += (effectivePrice + variantMod) * item.quantity;
    }

    // DTO kuponi yoki savat kuponi
    const effectiveCouponCode = dto.couponCode ?? cart.couponCode ?? null;
    let coupon: Coupon | null = null;
    if (effectiveCouponCode) {
      coupon = await this.validateCoupon(effectiveCouponCode, grandTotal);
    }

    const orders: Order[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const [sellerId, items] of sellerGroups) {
        // Narx hisoblash
        let totalAmount = 0;
        const orderItems: Partial<OrderItem>[] = [];

        for (const item of items) {
          const basePrice = parseFloat(item.product.basePrice);
          const discountPrice = item.product.discountPrice
            ? parseFloat(item.product.discountPrice)
            : null;

          const isDiscountActive =
            discountPrice !== null &&
            (!item.product.discountEndsAt ||
              new Date(item.product.discountEndsAt) > new Date());

          const effectivePrice = isDiscountActive ? discountPrice! : basePrice;
          const variantMod = item.variant
            ? parseFloat(item.variant.priceModifier)
            : 0;
          const unitPrice = effectivePrice + variantMod;
          const itemTotal = unitPrice * item.quantity;
          totalAmount += itemTotal;

          // Asosiy rasm
          const primaryImage = item.product.images?.find((i) => i.isPrimary);

          orderItems.push({
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            productName: item.product.name,
            productImage:
              primaryImage?.url ?? item.product.images?.[0]?.url ?? null,
            quantity: item.quantity,
            unitPrice: String(unitPrice),
            totalPrice: String(itemTotal),
          });

          // Zaxirani kamaytirish
          if (item.variant) {
            await manager.decrement(
              ProductVariant,
              { id: item.variant.id },
              'stockQuantity',
              item.quantity,
            );
          }
        }

        // Kupon chegirmasi (barcha buyurtmalarga teng taqsimlanadi)
        let discountAmount = 0;
        if (coupon) {
          const totalSellerGroups = sellerGroups.size;
          const couponPortion = 1 / totalSellerGroups;
          discountAmount = this.calculateDiscount(
            totalAmount,
            coupon,
            couponPortion,
          );
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);
        const orderNumber = generateOrderNumber();

        const order = manager.create(Order, {
          orderNumber,
          buyerId: userId,
          sellerId,
          status: OrderStatus.PENDING,
          totalAmount: String(totalAmount),
          discountAmount: String(discountAmount),
          finalAmount: String(finalAmount),
          shippingAddress: { ...dto.shippingAddress },
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          notes: dto.notes ?? null,
        });
        const savedOrder = await manager.save(order);

        // Order items
        const itemEntities = orderItems.map((oi) =>
          manager.create(OrderItem, { ...oi, orderId: savedOrder.id }),
        );
        await manager.save(itemEntities);

        // Status history — birinchi yozuv
        await manager.save(
          manager.create(OrderStatusHistory, {
            orderId: savedOrder.id,
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            changedById: userId,
            note: 'Buyurtma yaratildi',
          }),
        );

        orders.push(savedOrder);
      }

      // Kupon usage count oshirish
      if (coupon) {
        await manager.increment(Coupon, { id: coupon.id }, 'usageCount', 1);
      }

      // Savatni tozalash
      await manager.delete(CartItem, { cartId: cart.id });
      await manager.update(Cart, { id: cart.id }, { couponCode: null });
    });

    // To'liq ma'lumot bilan qaytarish
    const fullOrders: Order[] = [];
    for (const o of orders) {
      const full = await this.findByIdFull(o.id);
      fullOrders.push(full);
    }
    // Bildirishnomalar — transaction tashqarisida
    for (const order of orders) {
      const full = fullOrders.find((o) => o.id === order.id);
      const itemCount = full?.items?.length ?? 0;
      await this.notificationsService
        .notifyNewOrder(order.sellerId, order.orderNumber, order.id, itemCount)
        .catch((err) =>
          this.logger.error(`Notification xatosi: ${(err as Error).message}`),
        );
    }

    return fullOrders;
  }

  // ───────────────── STATUS UPDATE ─────────────────

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedById: string,
    note?: string,
  ): Promise<Order> {
    const order = await this.findByIdOrFail(orderId);

    if (!canTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `"${order.status}" statusidan "${newStatus}" statusiga o'tish mumkin emas`,
      );
    }

    const oldStatus = order.status;
    order.status = newStatus;

    // Agar delivered — paymentStatus ham "paid" qilamiz (COD uchun)
    if (
      newStatus === OrderStatus.DELIVERED &&
      order.paymentStatus === PaymentStatus.PENDING
    ) {
      order.paymentStatus = PaymentStatus.PAID;
    }
    // Shipped bo'lganda — delivery record yaratish
    if (newStatus === OrderStatus.SHIPPED) {
      const existingDelivery = await this.deliveryRepo.findOne({
        where: { orderId },
      });
      if (!existingDelivery) {
        await this.deliveryRepo.save(
          this.deliveryRepo.create({
            orderId,
            status: DeliveryStatus.WAITING,
            pickupAddress: {},
            deliveryAddress: order.shippingAddress
              ? { ...order.shippingAddress }
              : {},
          }),
        );
      }
    }

    await this.orderRepo.save(order);

    // Tarix yozish
    await this.historyRepo.save(
      this.historyRepo.create({
        orderId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedById,
        note: note ?? null,
      }),
    );

    // Agar bekor qilingan — zaxirani qaytarish
    if (newStatus === OrderStatus.CANCELLED) {
      await this.restoreStock(orderId);
      if (note) {
        order.cancelledReason = note;
        await this.orderRepo.save(order);
      }
    }
    // Buyer'ga xabar
    await this.notificationsService
      .notifyOrderStatus(order.buyerId, order.orderNumber, newStatus, orderId)
      .catch((err) =>
        this.logger.error(`Notification xatosi: ${(err as Error).message}`),
      );

    return this.findByIdFull(orderId);
  }

  // ───────────────── BUYER CANCEL ─────────────────

  async buyerCancel(
    orderId: string,
    userId: string,
    reason: string,
  ): Promise<Order> {
    const order = await this.findByIdOrFail(orderId);

    if (order.buyerId !== userId) {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }

    if (!buyerCanCancel(order.status)) {
      throw new BadRequestException(
        "Bu bosqichda buyurtmani bekor qilib bo'lmaydi",
      );
    }

    return this.updateStatus(orderId, OrderStatus.CANCELLED, userId, reason);
  }

  // ───────────────── QUERIES ─────────────────

  async findBuyerOrders(
    buyerId: string,
    query: OrdersQueryDto,
  ): Promise<PaginatedResult<Order>> {
    return this.findOrders({ ...query, buyerId });
  }

  async findSellerOrders(
    sellerId: string,
    query: OrdersQueryDto,
  ): Promise<PaginatedResult<Order>> {
    return this.findOrders({ ...query, sellerId });
  }

  async findAllOrders(query: OrdersQueryDto): Promise<PaginatedResult<Order>> {
    return this.findOrders(query);
  }

  async findByIdForBuyer(orderId: string, buyerId: string): Promise<Order> {
    const order = await this.findByIdFull(orderId);
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }
    return order;
  }

  async findByIdForSeller(orderId: string, sellerId: string): Promise<Order> {
    const order = await this.findByIdFull(orderId);
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }
    return order;
  }

  async getStatusHistory(orderId: string) {
    return this.historyRepo.find({
      where: { orderId },
      relations: ['changedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  // ───────────────── PRIVATE ─────────────────

  private async findOrders(
    query: OrdersQueryDto,
  ): Promise<PaginatedResult<Order>> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'oi')
      .leftJoin('o.buyer', 'buyer')
      .addSelect([
        'buyer.id',
        'buyer.firstName',
        'buyer.lastName',
        'buyer.email',
        'buyer.phone',
      ])
      .leftJoin('o.seller', 'seller')
      .addSelect(['seller.id', 'seller.firstName', 'seller.lastName']);

    if (query.buyerId) {
      qb.andWhere('o.buyerId = :bid', { bid: query.buyerId });
    }
    if (query.sellerId) {
      qb.andWhere('o.sellerId = :sid', { sid: query.sellerId });
    }
    if (query.status) {
      qb.andWhere('o.status = :st', { st: query.status });
    }
    if (query.paymentStatus) {
      qb.andWhere('o.paymentStatus = :ps', { ps: query.paymentStatus });
    }

    qb.orderBy('o.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, query.page, query.limit);
  }

  private async findByIdOrFail(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    return order;
  }

  private async findByIdFull(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'buyer', 'seller', 'statusHistory', 'delivery'],
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    return order;
  }

  private async restoreStock(orderId: string): Promise<void> {
    const items = await this.orderItemRepo.find({
      where: { orderId },
    });
    for (const item of items) {
      if (item.variantId) {
        await this.variantRepo.increment(
          { id: item.variantId },
          'stockQuantity',
          item.quantity,
        );
      }
    }
  }

  private async validateCoupon(
    code: string,
    totalOrderAmount: number,
  ): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });
    if (!coupon) {
      throw new BadRequestException('Kupon topilmadi yoki noaktiv');
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new BadRequestException('Kupon hali amal qilmaydi');
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      throw new BadRequestException("Kupon muddati o'tgan");
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Kupon limiti tugagan');
    }
    if (
      coupon.minOrderAmount &&
      totalOrderAmount < parseFloat(coupon.minOrderAmount)
    ) {
      throw new BadRequestException(
        `Kupon uchun minimal buyurtma summasi: ${parseFloat(coupon.minOrderAmount).toLocaleString('uz-UZ')} so'm`,
      );
    }
    return coupon;
  }

  private calculateDiscount(
    amount: number,
    coupon: Coupon,
    portion: number,
  ): number {
    let discount: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = amount * (parseFloat(coupon.value) / 100);
    } else {
      // FIXED — seller ulushiga teng taqsimlaymiz
      discount = parseFloat(coupon.value) * portion;
    }

    // maxDiscountAmount cheklovi (seller ulushiga nisbatan)
    if (coupon.maxDiscountAmount) {
      const max = parseFloat(coupon.maxDiscountAmount) * portion;
      discount = Math.min(discount, max);
    }

    return Math.round(discount);
  }
}
