import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, TreeRepository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-category.dto';
import { generateSlug, uniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: TreeRepository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────── CRUD ─────────────────

  async create(dto: CreateCategoryDto): Promise<Category> {
    let slug = dto.slug
      ? dto.slug.toLowerCase().trim()
      : generateSlug(dto.name);

    // Slug unique tekshiruvi
    const existingSlug = await this.categoryRepo.findOne({ where: { slug } });
    if (existingSlug) {
      if (dto.slug) {
        // Foydalanuvchi o'zi bergan slug band
        throw new ConflictException(`"${slug}" slug allaqachon mavjud`);
      }
      // Avtogeneratsiya — suffix qo'shamiz
      slug = uniqueSlug(slug);
    }

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent kategoriya topilmadi');
      }
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      parent,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findByIdOrFail(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findOne({
        where: { slug: dto.slug.toLowerCase().trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`"${dto.slug}" slug allaqachon mavjud`);
      }
      category.slug = dto.slug.toLowerCase().trim();
    } else if (dto.name && dto.name !== category.name && !dto.slug) {
      // Nom o'zgarsa va slug berilmagan — slugni ham yangilaymiz
      let newSlug = generateSlug(dto.name);
      const existing = await this.categoryRepo.findOne({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== id) {
        newSlug = uniqueSlug(newSlug);
      }
      category.slug = newSlug;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
        category.parentId = null;
      } else {
        if (dto.parentId === id) {
          throw new BadRequestException(
            "Kategoriya o'ziga o'zi parent bo'la olmaydi",
          );
        }
        // Rekursiv tekshiruv: yangi parent bu kategoriyaning descendant'i emasligini tekshirish
        const descendants = await this.categoryRepo.findDescendants(category);
        const isDescendant = descendants.some((d) => d.id === dto.parentId);
        if (isDescendant) {
          throw new BadRequestException(
            "Kategoriyani o'zining sub-kategoriyasi ostiga qo'yib bo'lmaydi",
          );
        }
        const newParent = await this.categoryRepo.findOne({
          where: { id: dto.parentId },
        });
        if (!newParent) {
          throw new NotFoundException('Parent kategoriya topilmadi');
        }
        category.parent = newParent;
      }
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findByIdOrFail(id);
    const children = await this.categoryRepo.findDescendants(category);
    // O'zi + bolalari
    if (children.length > 1) {
      throw new BadRequestException(
        `Bu kategoriyaning ${children.length - 1} ta sub-kategoriyasi bor. Avval ularni o'chiring yoki ko'chiring.`,
      );
    }

    // Mahsulotlar bormi?
    const productCount = await this.dataSource
      .createQueryBuilder()
      .from('products', 'p')
      .where('p.category_id = :id', { id })
      .getCount();

    if (productCount > 0) {
      throw new BadRequestException(
        `Bu kategoriyada ${productCount} ta mahsulot bor. Avval ularni boshqa kategoriyaga ko'chiring.`,
      );
    }

    await this.categoryRepo.remove(category);
  }

  // ───────────────── QUERY ─────────────────

  async findTree(): Promise<Category[]> {
    const trees = await this.categoryRepo.findTrees({
      relations: [],
    });
    return this.sortTree(trees);
  }

  async findActiveTree(): Promise<Category[]> {
    const allTrees = await this.categoryRepo.findTrees();
    const filtered = this.filterActive(allTrees);
    return this.sortTree(filtered);
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
    // Sub-kategoriyalarni ham yuklaymiz
    const descendants = await this.categoryRepo.findDescendantsTree(category);
    return descendants;
  }

  async findAncestors(id: string): Promise<Category[]> {
    const category = await this.findByIdOrFail(id);
    return this.categoryRepo.findAncestors(category);
  }

  // ───────────────── REORDER ─────────────────

  async reorder(dto: ReorderCategoriesDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        await manager.update(Category, item.id, {
          sortOrder: item.sortOrder,
        });
      }
    });
  }

  // ───────────────── HELPERS ─────────────────

  /**
   * Daraxtni sortOrder bo'yicha tartiblash (rekursiv).
   */
  private sortTree(nodes: Category[]): Category[] {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortTree(node.children);
      }
    }
    return nodes;
  }

  /**
   * Faqat aktiv kategoriyalarni filtrlash (rekursiv).
   */
  private filterActive(nodes: Category[]): Category[] {
    return nodes
      .filter((n) => n.isActive)
      .map((n) => ({
        ...n,
        children: n.children ? this.filterActive(n.children) : [],
      }));
  }
}
