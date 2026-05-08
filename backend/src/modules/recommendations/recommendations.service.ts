import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ProductView } from '../../database/entities/product-view.entity';
import { ProductStatus } from '../../database/entities/enums';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductView)
    private readonly viewRepo: Repository<ProductView>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────── PRODUCT VIEW TRACKING ─────────

  async trackView(
    productId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    // Bir xil user/session bir mahsulotni 5 daqiqa ichida qayta ko'rsa — yozmaslik
    if (userId || sessionId) {
      const recentView = await this.dataSource.query(
        `
        SELECT 1 FROM product_views
        WHERE product_id = $1
          AND (user_id = $2 OR session_id = $3)
          AND viewed_at >= NOW() - INTERVAL '5 minutes'
        LIMIT 1
      `,
        [productId, userId, sessionId],
      );
      if (recentView.length > 0) return;
    }

    await this.viewRepo.save(
      this.viewRepo.create({
        productId,
        userId: userId ?? null,
        sessionId: sessionId ?? null,
      }),
    );

    // view_count oshirish
    await this.productRepo.increment({ id: productId }, 'viewCount', 1);
  }

  // ───────── SIMILAR PRODUCTS ─────────

  async similar(productId: string, limit = 8): Promise<Product[]> {
    // Bir xil kategoriya + narx oralig'ida
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) return [];

    const basePrice = parseFloat(product.basePrice);
    const priceMin = basePrice * 0.5;
    const priceMax = basePrice * 1.5;

    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .where('p.id != :id', { id: productId })
      .andWhere('p.status = :active', { active: ProductStatus.ACTIVE })
      .andWhere('p.categoryId = :catId', { catId: product.categoryId })
      .andWhere('CAST(p.basePrice AS NUMERIC) BETWEEN :pmin AND :pmax', {
        pmin: priceMin,
        pmax: priceMax,
      })
      .orderBy('p.ratingAvg', 'DESC')
      .addOrderBy('p.viewCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  // ───────── TRENDING ─────────

  async trending(limit = 12): Promise<Product[]> {
    // Oxirgi 7 kunda eng ko'p ko'rilganlar
    const productIds = await this.dataSource.query(
      `
      SELECT pv.product_id, COUNT(*) as views
      FROM product_views pv
      JOIN products p ON p.id = pv.product_id AND p.status = 'active'
      WHERE pv.viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY pv.product_id
      ORDER BY views DESC
      LIMIT $1
    `,
      [limit],
    );

    if (productIds.length === 0) {
      // Fallback: eng ko'p ko'rilganlar (all time)
      return this.productRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
        .where('p.status = :active', { active: ProductStatus.ACTIVE })
        .orderBy('p.viewCount', 'DESC')
        .limit(limit)
        .getMany();
    }

    const ids = productIds.map((r: { product_id: string }) => r.product_id);
    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .where('p.id IN (:...ids)', { ids })
      .orderBy(`array_position(ARRAY[:...ids]::uuid[], p.id)`)
      .getMany();
  }

  // ───────── RECENTLY VIEWED ─────────

  async recentlyViewed(userId: string, limit = 20): Promise<Product[]> {
    const views = await this.dataSource.query(
      `
      SELECT DISTINCT ON (pv.product_id)
        pv.product_id, pv.viewed_at
      FROM product_views pv
      JOIN products p ON p.id = pv.product_id AND p.status = 'active'
      WHERE pv.user_id = $1
      ORDER BY pv.product_id, pv.viewed_at DESC
    `,
      [userId],
    );

    if (views.length === 0) return [];

    // Eng oxirgi ko'rilganlar birinchi
    const sorted = views
      .sort(
        (a: { viewed_at: Date }, b: { viewed_at: Date }) =>
          new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime(),
      )
      .slice(0, limit);

    const ids = sorted.map((v: { product_id: string }) => v.product_id);

    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .where('p.id IN (:...ids)', { ids })
      .orderBy(`array_position(ARRAY[:...ids]::uuid[], p.id)`)
      .getMany();
  }

  // ───────── FOR YOU (personalized) ─────────

  async forYou(userId: string, limit = 12): Promise<Product[]> {
    // Foydalanuvchi ko'rgan mahsulotlarning kategoriyalariga qarab tavsiya
    const topCategories = await this.dataSource.query(
      `
      SELECT p.category_id, COUNT(*) as cnt
      FROM product_views pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.user_id = $1
        AND pv.viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.category_id
      ORDER BY cnt DESC
      LIMIT 5
    `,
      [userId],
    );

    if (topCategories.length === 0) {
      // Yangi foydalanuvchi — trending qaytaramiz
      return this.trending(limit);
    }

    const catIds = topCategories.map(
      (r: { category_id: string }) => r.category_id,
    );

    // Bu kategoriyalardagi eng yaxshi mahsulotlar, foydalanuvchi ko'rmaganlarini
    const viewedIds = await this.dataSource.query(
      `
      SELECT DISTINCT product_id FROM product_views WHERE user_id = $1
    `,
      [userId],
    );
    const excludeIds = viewedIds.map(
      (v: { product_id: string }) => v.product_id,
    );

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .where('p.status = :active', { active: ProductStatus.ACTIVE })
      .andWhere('p.categoryId IN (:...catIds)', { catIds });

    if (excludeIds.length > 0) {
      qb.andWhere('p.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return qb
      .orderBy('CAST(p.ratingAvg AS NUMERIC)', 'DESC')
      .addOrderBy('p.viewCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  // ───────── ALSO VIEWED (collaborative) ─────────

  async alsoViewed(productId: string, limit = 8): Promise<Product[]> {
    // Bu mahsulotni ko'rgan foydalanuvchilar yana nimani ko'rgan
    const results = await this.dataSource.query(
      `
      SELECT pv2.product_id, COUNT(DISTINCT pv2.user_id) as viewers
      FROM product_views pv1
      JOIN product_views pv2
        ON pv2.user_id = pv1.user_id
        AND pv2.product_id != $1
        AND pv2.viewed_at >= NOW() - INTERVAL '30 days'
      JOIN products p ON p.id = pv2.product_id AND p.status = 'active'
      WHERE pv1.product_id = $1
        AND pv1.user_id IS NOT NULL
        AND pv1.viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY pv2.product_id
      ORDER BY viewers DESC
      LIMIT $2
    `,
      [productId, limit],
    );

    if (results.length === 0) {
      return this.similar(productId, limit);
    }

    const ids = results.map((r: { product_id: string }) => r.product_id);
    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
      .where('p.id IN (:...ids)', { ids })
      .orderBy(`array_position(ARRAY[:...ids]::uuid[], p.id)`)
      .getMany();
  }
}
