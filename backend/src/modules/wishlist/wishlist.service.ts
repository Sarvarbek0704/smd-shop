import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../../database/entities/wishlist.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductStatus } from '../../database/entities/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getMyWishlist(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const qb = this.wishlistRepo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.product', 'p')
      .leftJoinAndSelect('p.images', 'img')
      .where('w.userId = :uid', { uid: userId })
      .andWhere('p.status = :active', { active: ProductStatus.ACTIVE })
      .orderBy('w.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await qb.getManyAndCount();

    const mapped = items.map((w) => {
      const primaryImage = w.product.images?.find((i) => i.isPrimary);
      return {
        id: w.id,
        createdAt: w.createdAt,
        product: {
          id: w.product.id,
          name: w.product.name,
          slug: w.product.slug,
          basePrice: w.product.basePrice,
          discountPrice: w.product.discountPrice,
          discountEndsAt: w.product.discountEndsAt,
          ratingAvg: w.product.ratingAvg,
          ratingCount: w.product.ratingCount,
          image: primaryImage?.url ?? w.product.images?.[0]?.url ?? null,
        },
      };
    });

    return buildPaginated(mapped, total, query.page, query.limit);
  }

  async add(userId: string, productId: string) {
    const product = await this.productRepo.findOne({
      where: { id: productId, status: ProductStatus.ACTIVE },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi yoki noaktiv');
    }

    const exists = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });
    if (exists) {
      throw new BadRequestException('Mahsulot allaqachon sevimlilarda');
    }

    await this.wishlistRepo.save(
      this.wishlistRepo.create({ userId, productId }),
    );

    return { ok: true };
  }

  async remove(userId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });
    if (!item) {
      throw new NotFoundException('Mahsulot sevimlilarda topilmadi');
    }
    await this.wishlistRepo.remove(item);
  }

  async check(userId: string, productId: string) {
    const exists = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });
    return { inWishlist: !!exists };
  }
}
