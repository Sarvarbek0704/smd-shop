import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository, TreeRepository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductStatus } from '../../database/entities/enums';
import { SearchQueryDto, SearchSortBy } from './dto/search-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: TreeRepository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async search(query: SearchQueryDto): Promise<PaginatedResult<Product>> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.variants', 'v')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoin('p.seller', 'seller')
      .addSelect(['seller.id', 'seller.firstName', 'seller.lastName'])
      .where('p.status = :active', { active: ProductStatus.ACTIVE });

    // Full-Text Search
    const searchTerm = query.q.trim();
    if (searchTerm) {
      // Har bir so'zga :* qo'shib prefix search qilamiz
      const tsQuery = searchTerm
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((w) => `${w}:*`)
        .join(' & ');

      qb.andWhere(`p.search_vector @@ to_tsquery('simple', :tsq)`, {
        tsq: tsQuery,
      });

      // Relevance score
      qb.addSelect(
        `ts_rank(p.search_vector, to_tsquery('simple', :tsq))`,
        'search_rank',
      );
    }

    // Kategoriya filtri
    if (query.category) {
      const category = await this.categoryRepo.findOne({
        where: { slug: query.category },
      });
      if (category) {
        const descendants = await this.categoryRepo.findDescendants(category);
        const ids = descendants.map((d) => d.id);
        qb.andWhere('p.categoryId IN (:...catIds)', { catIds: ids });
      }
    }

    // Narx filtri
    if (query.minPrice !== undefined) {
      qb.andWhere('CAST(p.basePrice AS NUMERIC) >= :pmin', {
        pmin: query.minPrice,
      });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('CAST(p.basePrice AS NUMERIC) <= :pmax', {
        pmax: query.maxPrice,
      });
    }

    // Reyting filtri
    if (query.rating !== undefined) {
      qb.andWhere('CAST(p.ratingAvg AS NUMERIC) >= :rat', {
        rat: query.rating,
      });
    }

    // Seller filtri
    if (query.seller) {
      qb.andWhere('p.sellerId = :sid', { sid: query.seller });
    }

    // Stok filtri
    if (query.inStock) {
      qb.andWhere(
        new Brackets((b) => {
          b.where(
            `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_quantity > 0 AND pv.is_active = true)`,
          ).orWhere(
            `NOT EXISTS (SELECT 1 FROM product_variants pv2 WHERE pv2.product_id = p.id)`,
          );
        }),
      );
    }

    // Chegirma filtri
    if (query.hasDiscount) {
      qb.andWhere('p.discountPrice IS NOT NULL').andWhere(
        new Brackets((b) => {
          b.where('p.discountEndsAt IS NULL').orWhere(
            'p.discountEndsAt > NOW()',
          );
        }),
      );
    }

    // Tartiblash
    const sort = query.sort ?? SearchSortBy.RELEVANCE;
    switch (sort) {
      case SearchSortBy.RELEVANCE:
        if (searchTerm) {
          qb.orderBy('search_rank', 'DESC');
        } else {
          qb.orderBy('p.createdAt', 'DESC');
        }
        break;
      case SearchSortBy.PRICE_ASC:
        qb.orderBy('CAST(p.basePrice AS NUMERIC)', 'ASC');
        break;
      case SearchSortBy.PRICE_DESC:
        qb.orderBy('CAST(p.basePrice AS NUMERIC)', 'DESC');
        break;
      case SearchSortBy.RATING:
        qb.orderBy('CAST(p.ratingAvg AS NUMERIC)', 'DESC');
        break;
      case SearchSortBy.NEWEST:
        qb.orderBy('p.createdAt', 'DESC');
        break;
      case SearchSortBy.POPULAR:
        qb.orderBy('p.viewCount', 'DESC');
        break;
    }

    qb.addOrderBy('img.sortOrder', 'ASC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, query.page, query.limit);
  }

  async autocomplete(q: string, limit = 8): Promise<string[]> {
    if (!q || q.trim().length < 2) return [];

    const results = await this.dataSource.query(
      `
      SELECT DISTINCT name
      FROM products
      WHERE status = 'active'
        AND name ILIKE $1
      ORDER BY name
      LIMIT $2
    `,
      [`%${q.trim()}%`, limit],
    );

    return results.map((r: { name: string }) => r.name);
  }

  async popular(): Promise<string[]> {
    // Eng ko'p ko'rilgan mahsulot nomlari — oddiy variant
    const results = await this.dataSource.query(`
      SELECT p.name, COUNT(pv.id) as view_count
      FROM product_views pv
      JOIN products p ON p.id = pv.product_id AND p.status = 'active'
      WHERE pv.viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY p.name
      ORDER BY view_count DESC
      LIMIT 10
    `);

    return results.map((r: { name: string }) => r.name);
  }
}
