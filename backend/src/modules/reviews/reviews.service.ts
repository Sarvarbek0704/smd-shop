import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Product } from '../../database/entities/product.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderStatus, RoleName } from '../../database/entities/enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsQueryDto, ReviewSortBy } from './dto/reviews-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Mahsulot bormi
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    // O'z mahsulotiga sharh yozib bo'lmaydi
    if (product.sellerId === userId) {
      throw new BadRequestException("O'z mahsulotingizga sharh yoza olmaysiz");
    }

    // Foydalanuvchi bu mahsulotga allaqachon sharh yozganmi
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) {
      throw new BadRequestException(
        'Siz bu mahsulotga allaqachon sharh yozgansiz',
      );
    }

    // Verified purchase tekshiruvi
    let isVerifiedPurchase = false;
    if (dto.orderId) {
      const order = await this.orderRepo.findOne({
        where: {
          id: dto.orderId,
          buyerId: userId,
          status: OrderStatus.DELIVERED,
        },
      });
      if (!order) {
        throw new BadRequestException(
          'Buyurtma topilmadi yoki hali yetkazilmagan',
        );
      }
      // Buyurtmada shu mahsulot borligini tekshirish
      const hasProduct = await this.dataSource
        .createQueryBuilder()
        .from('order_items', 'oi')
        .where('oi.order_id = :orderId', { orderId: dto.orderId })
        .andWhere('oi.product_id = :productId', { productId: dto.productId })
        .getCount();
      if (hasProduct === 0) {
        throw new BadRequestException("Bu buyurtmada shu mahsulot yo'q");
      }
      isVerifiedPurchase = true;
    }

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        userId,
        productId: dto.productId,
        orderId: dto.orderId ?? null,
        rating: dto.rating,
        title: dto.title ?? null,
        body: dto.body,
        images: dto.images ?? [],
        isVerifiedPurchase,
        isPublished: true,
      }),
    );

    // Mahsulotning reyting o'rtachasini qayta hisoblash
    await this.recalculateRating(dto.productId);
    // Seller'ga xabar
    await this.notificationsService
      .notifyNewReview(
        product.sellerId,
        product.name,
        dto.rating,
        review.id,
        product.id,
      )
      .catch(() => {});

    return review;
  }

  async findByProduct(
    productId: string,
    query: ReviewsQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoin('r.user', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName', 'u.avatarUrl'])
      .where('r.productId = :pid', { pid: productId })
      .andWhere('r.isPublished = true');

    if (query.rating) {
      qb.andWhere('r.rating = :rt', { rt: query.rating });
    }

    const sortBy = query.sortBy ?? ReviewSortBy.CREATED;
    qb.orderBy(`r.${sortBy}`, 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();

    const mapped = items.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      images: r.images,
      isVerifiedPurchase: r.isVerifiedPurchase,
      sellerReply: r.sellerReply,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        avatarUrl: r.user.avatarUrl,
      },
    }));

    return buildPaginated(mapped, total, query.page, query.limit);
  }

  async getProductRatingSummary(productId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :pid', { pid: productId })
      .andWhere('r.isPublished = true')
      .groupBy('r.rating')
      .orderBy('r.rating', 'DESC')
      .getRawMany<{ rating: number; count: string }>();

    const total = result.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    const distribution = Object.fromEntries(
      [5, 4, 3, 2, 1].map((star) => {
        const found = result.find((r) => r.rating === star);
        return [star, parseInt(found?.count ?? '0', 10)];
      }),
    );

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    return {
      averageRating: product?.ratingAvg ?? '0',
      totalReviews: total,
      distribution,
    };
  }

  // Seller javob yozishi
  async sellerReply(
    reviewId: string,
    sellerId: string,
    reply: string,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['product'],
    });
    if (!review) {
      throw new NotFoundException('Sharh topilmadi');
    }
    if (review.product.sellerId !== sellerId) {
      throw new ForbiddenException('Bu mahsulot sizga tegishli emas');
    }
    if (review.sellerReply) {
      throw new BadRequestException('Siz allaqachon javob yozgansiz');
    }

    review.sellerReply = reply;
    return this.reviewRepo.save(review);
  }

  // Admin: sharhni yashirish/ko'rsatish
  async togglePublish(reviewId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Sharh topilmadi');
    }
    review.isPublished = !review.isPublished;
    await this.reviewRepo.save(review);
    await this.recalculateRating(review.productId);
    return review;
  }

  // Sharhni o'chirish
  async remove(reviewId: string, user: AuthUser): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Sharh topilmadi');
    }
    // Faqat o'zi yoki admin
    if (review.userId !== user.id && !user.roles.includes(RoleName.ADMIN)) {
      throw new ForbiddenException('Bu sharh sizga tegishli emas');
    }
    const productId = review.productId;
    await this.reviewRepo.remove(review);
    await this.recalculateRating(productId);
  }

  // ───────── Reyting hisoblash ─────────

  private async recalculateRating(productId: string): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :pid', { pid: productId })
      .andWhere('r.isPublished = true')
      .getRawOne<{ avg: string | null; count: string }>();

    const avg = result?.avg ? parseFloat(result.avg).toFixed(2) : '0';
    const count = parseInt(result?.count ?? '0', 10);

    await this.productRepo.update(productId, {
      ratingAvg: avg,
      ratingCount: count,
    });
  }
}
