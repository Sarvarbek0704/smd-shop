import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository, TreeRepository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { ProductImage } from '../../database/entities/product-image.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductStatus, RoleName } from '../../database/entities/enums';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductsQueryDto,
  ProductSortBy,
  SortOrder,
} from './dto/products-query.dto';
import { AddImageDto } from './dto/add-image.dto';
import { generateSlug, uniqueSlug } from '../../common/utils/slug.util';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoryRepo: TreeRepository<Category>,
    private readonly dataSource: DataSource,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  // ───────────────── CREATE ─────────────────

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    // Kategoriya tekshiruvi
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi yoki noaktiv');
    }

    // Slug
    let slug = dto.slug
      ? dto.slug.toLowerCase().trim()
      : generateSlug(dto.name);
    const existingSlug = await this.productRepo.findOne({ where: { slug } });
    if (existingSlug) {
      if (dto.slug) {
        throw new ConflictException(`"${slug}" slug allaqachon mavjud`);
      }
      slug = uniqueSlug(slug);
    }

    // Rasmlar ichida faqat bitta isPrimary bo'lishi kerak
    if (dto.images && dto.images.length > 0) {
      const primaryCount = dto.images.filter((i) => i.isPrimary).length;
      if (primaryCount > 1) {
        throw new BadRequestException(
          "Faqat bitta asosiy rasm bo'lishi mumkin",
        );
      }
      // Agar hech biri primary emas — birinchisini primary qilamiz
      if (primaryCount === 0) {
        dto.images[0].isPrimary = true;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const product = manager.create(Product, {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription ?? null,
        basePrice: String(dto.basePrice),
        discountPrice:
          dto.discountPrice != null ? String(dto.discountPrice) : null,
        discountEndsAt: dto.discountEndsAt
          ? new Date(dto.discountEndsAt)
          : null,
        categoryId: dto.categoryId,
        sellerId,
        status: dto.status ?? ProductStatus.DRAFT,
        isFeatured: dto.isFeatured ?? false,
      });
      const saved = await manager.save(product);

      // Variantlar
      if (dto.variants && dto.variants.length > 0) {
        const variants = dto.variants.map((v) =>
          manager.create(ProductVariant, {
            productId: saved.id,
            sku: v.sku,
            name: v.name,
            priceModifier: String(v.priceModifier ?? 0),
            stockQuantity: v.stockQuantity,
            attributes: v.attributes ?? {},
            imageUrl: v.imageUrl ?? null,
            isActive: v.isActive ?? true,
          }),
        );
        await manager.save(variants);
      }

      // Rasmlar
      if (dto.images && dto.images.length > 0) {
        const images = dto.images.map((img) =>
          manager.create(ProductImage, {
            productId: saved.id,
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder ?? 0,
            isPrimary: img.isPrimary ?? false,
          }),
        );
        await manager.save(images);
      }

      return this.findByIdFull(saved.id);
    });
  }

  // ───────────────── UPDATE ─────────────────

  async update(
    id: string,
    dto: UpdateProductDto,
    user: AuthUser,
  ): Promise<Product> {
    const product = await this.findByIdOrFail(id);
    this.checkOwnership(product, user);

    // Slug
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productRepo.findOne({
        where: { slug: dto.slug.toLowerCase().trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`"${dto.slug}" slug allaqachon mavjud`);
      }
      product.slug = dto.slug.toLowerCase().trim();
    } else if (dto.name && dto.name !== product.name && !dto.slug) {
      let newSlug = generateSlug(dto.name);
      const existing = await this.productRepo.findOne({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== id) {
        newSlug = uniqueSlug(newSlug);
      }
      product.slug = newSlug;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, isActive: true },
      });
      if (!category) {
        throw new NotFoundException('Kategoriya topilmadi');
      }
    }

    // Oddiy maydonlarni yangilash
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.shortDescription !== undefined)
      product.shortDescription = dto.shortDescription ?? null;
    if (dto.basePrice !== undefined) product.basePrice = String(dto.basePrice);
    if (dto.discountPrice !== undefined)
      product.discountPrice =
        dto.discountPrice != null ? String(dto.discountPrice) : null;
    if (dto.discountEndsAt !== undefined)
      product.discountEndsAt = dto.discountEndsAt
        ? new Date(dto.discountEndsAt)
        : null;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.isFeatured !== undefined) product.isFeatured = dto.isFeatured;

    // Status — seller faqat draft ↔ active o'zgartira oladi, admin barchani
    if (dto.status !== undefined) {
      if (!user.roles.includes(RoleName.ADMIN)) {
        const allowed: ProductStatus[] = [
          ProductStatus.DRAFT,
          ProductStatus.ACTIVE,
        ];
        if (!allowed.includes(dto.status)) {
          throw new ForbiddenException(
            "Siz faqat draft va active statuslarini o'zgartira olasiz",
          );
        }
      }
      product.status = dto.status;
    }

    await this.productRepo.save(product);

    // Variantlarni to'liq almashtirish (berilgan bo'lsa)
    if (dto.variants !== undefined) {
      await this.variantRepo.delete({ productId: id });
      if (dto.variants.length > 0) {
        const variants = dto.variants.map((v) =>
          this.variantRepo.create({
            productId: id,
            sku: v.sku,
            name: v.name,
            priceModifier: String(v.priceModifier ?? 0),
            stockQuantity: v.stockQuantity,
            attributes: v.attributes ?? {},
            imageUrl: v.imageUrl ?? null,
            isActive: v.isActive ?? true,
          }),
        );
        await this.variantRepo.save(variants);
      }
    }

    // Rasmlarni dto.images bilan to'liq almashtirish
    if (dto.images !== undefined) {
      await this.imageRepo.delete({ productId: id });
      if (dto.images.length > 0) {
        const primaryCount = dto.images.filter((i) => i.isPrimary).length;
        if (primaryCount > 1) {
          throw new BadRequestException(
            "Faqat bitta asosiy rasm bo'lishi mumkin",
          );
        }
        if (primaryCount === 0) dto.images[0].isPrimary = true;

        const images = dto.images.map((img) =>
          this.imageRepo.create({
            productId: id,
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder ?? 0,
            isPrimary: img.isPrimary ?? false,
          }),
        );
        await this.imageRepo.save(images);
      }
    }

    return this.findByIdFull(id);
  }

  // ───────────────── DELETE ─────────────────

  async remove(id: string, user: AuthUser): Promise<void> {
    const product = await this.findByIdOrFail(id);
    this.checkOwnership(product, user);

    // Aktiv buyurtmalarda ishlatilayotganini tekshirish
    const activeOrderItems = await this.dataSource
      .createQueryBuilder()
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'o.id = oi.order_id')
      .where('oi.product_id = :id', { id })
      .andWhere('o.status NOT IN (:...statuses)', {
        statuses: ['delivered', 'cancelled', 'refunded'],
      })
      .getCount();

    if (activeOrderItems > 0) {
      throw new BadRequestException(
        "Bu mahsulot aktiv buyurtmalarda mavjud. O'chirish mumkin emas.",
      );
    }

    await this.productRepo.remove(product);
  }

  // ───────────────── IMAGES ─────────────────

  async addImage(
    productId: string,
    dto: AddImageDto,
    user: AuthUser,
  ): Promise<ProductImage> {
    const product = await this.findByIdOrFail(productId);
    this.checkOwnership(product, user);

    if (dto.isPrimary) {
      // Eski primary'ni o'chiramiz
      await this.imageRepo.update(
        { productId, isPrimary: true },
        { isPrimary: false },
      );
    }

    const image = this.imageRepo.create({
      productId,
      url: dto.url,
      altText: dto.altText ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isPrimary: dto.isPrimary ?? false,
    });
    return this.imageRepo.save(image);
  }

  async removeImage(
    productId: string,
    imageId: string,
    user: AuthUser,
  ): Promise<void> {
    const product = await this.findByIdOrFail(productId);
    this.checkOwnership(product, user);

    const image = await this.imageRepo.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Rasm topilmadi');
    }
    await this.imageRepo.remove(image);

    // Agar primary o'chirilgan bo'lsa — birinchi rasmni primary qilamiz
    if (image.isPrimary) {
      const first = await this.imageRepo.findOne({
        where: { productId },
        order: { sortOrder: 'ASC' },
      });
      if (first) {
        await this.imageRepo.update(first.id, { isPrimary: true });
      }
    }
  }

  async setPrimaryImage(
    productId: string,
    imageId: string,
    user: AuthUser,
  ): Promise<void> {
    const product = await this.findByIdOrFail(productId);
    this.checkOwnership(product, user);

    const image = await this.imageRepo.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Rasm topilmadi');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        ProductImage,
        { productId, isPrimary: true },
        { isPrimary: false },
      );
      await manager.update(ProductImage, imageId, { isPrimary: true });
    });
  }

  // ───────────────── QUERIES ─────────────────

  async findAll(query: ProductsQueryDto): Promise<PaginatedResult<Product>> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.variants', 'v')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoin('p.seller', 'seller')
      .addSelect(['seller.id', 'seller.firstName', 'seller.lastName']);

    // Faqat aktiv mahsulotlar (public endpoint uchun)
    if (!query.status) {
      qb.andWhere('p.status = :activeStatus', {
        activeStatus: ProductStatus.ACTIVE,
      });
    } else {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    // Matn qidirish
    if (query.search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('p.name ILIKE :q', { q: `%${query.search}%` })
            .orWhere('p.description ILIKE :q', { q: `%${query.search}%` })
            .orWhere('p.shortDescription ILIKE :q', { q: `%${query.search}%` });
        }),
      );
    }

    // Kategoriya filtri (sub-kategoriyalar bilan)
    if (query.categoryId) {
      if (query.includeSubcategories !== false) {
        const parent = await this.categoryRepo.findOne({
          where: { id: query.categoryId },
        });
        if (parent) {
          const descendants = await this.categoryRepo.findDescendants(parent);
          const ids = descendants.map((d) => d.id);
          qb.andWhere('p.categoryId IN (:...catIds)', { catIds: ids });
        }
      } else {
        qb.andWhere('p.categoryId = :catId', { catId: query.categoryId });
      }
    }

    if (query.sellerId) {
      qb.andWhere('p.sellerId = :sid', { sid: query.sellerId });
    }

    if (query.priceMin !== undefined) {
      qb.andWhere('CAST(p.basePrice AS NUMERIC) >= :pmin', {
        pmin: query.priceMin,
      });
    }
    if (query.priceMax !== undefined) {
      qb.andWhere('CAST(p.basePrice AS NUMERIC) <= :pmax', {
        pmax: query.priceMax,
      });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('p.isFeatured = :feat', { feat: query.isFeatured });
    }

    // Tartiblash
    const sortBy = query.sortBy ?? ProductSortBy.CREATED;
    const order = query.order ?? SortOrder.DESC;
    qb.orderBy(`p.${sortBy}`, order);

    // Rasm tartibi
    qb.addOrderBy('img.sortOrder', 'ASC');

    // Pagination
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, query.page, query.limit);
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { slug, status: ProductStatus.ACTIVE },
      relations: ['images', 'variants', 'category', 'seller'],
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    // View count oshirish (async, xato bo'lsa ham davom etsin)
    this.recommendationsService.trackView(product.id).catch(() => {});

    return product;
  }

  async findByIdFull(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'variants', 'category', 'seller'],
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return product;
  }

  // ───────────────── SELLER ─────────────────

  async findSellerProducts(
    sellerId: string,
    query: ProductsQueryDto,
  ): Promise<PaginatedResult<Product>> {
    // Seller o'z mahsulotlarini ko'radi — barcha statusdagilarni
    const modQuery = { ...query, sellerId, status: query.status ?? undefined };
    // Status yo'q bo'lsa — hammasi (draft, active, out_of_stock)
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.variants', 'v')
      .leftJoinAndSelect('p.category', 'cat')
      .where('p.sellerId = :sid', { sid: sellerId });

    if (modQuery.status) {
      qb.andWhere('p.status = :st', { st: modQuery.status });
    }

    if (modQuery.search) {
      qb.andWhere('p.name ILIKE :q', { q: `%${modQuery.search}%` });
    }

    const sortBy = modQuery.sortBy ?? ProductSortBy.CREATED;
    const order = modQuery.order ?? SortOrder.DESC;
    qb.orderBy(`p.${sortBy}`, order)
      .addOrderBy('img.sortOrder', 'ASC')
      .skip((modQuery.page - 1) * modQuery.limit)
      .take(modQuery.limit);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, modQuery.page, modQuery.limit);
  }

  // ───────────────── ADMIN ─────────────────

  async adminUpdateStatus(id: string, status: ProductStatus): Promise<Product> {
    const product = await this.findByIdOrFail(id);
    product.status = status;
    await this.productRepo.save(product);
    return this.findByIdFull(id);
  }

  // ───────────────── HELPERS ─────────────────

  private async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'variants'],
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return product;
  }

  private checkOwnership(product: Product, user: AuthUser): void {
    if (user.roles.includes(RoleName.ADMIN)) return;
    if (product.sellerId !== user.id) {
      throw new ForbiddenException('Bu mahsulot sizga tegishli emas');
    }
  }
}
