import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { Review } from './review.entity';
import { ProductStatus } from './enums';

@Entity('products')
@Index(['status'])
@Index(['categoryId'])
@Index(['sellerId'])
export class Product extends BaseEntity {
  @ManyToOne(() => User, (u) => u.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId!: string;

  @ManyToOne(() => Category, (c) => c.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 280, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 500, nullable: true })
  shortDescription!: string | null;

  @Column({ name: 'base_price', type: 'numeric', precision: 12, scale: 2 })
  basePrice!: string;

  @Column({ name: 'discount_price', type: 'numeric', precision: 12, scale: 2, nullable: true })
  discountPrice!: string | null;

  @Column({ name: 'discount_ends_at', type: 'timestamptz', nullable: true })
  discountEndsAt!: Date | null;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount!: number;

  @Column({ name: 'rating_avg', type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAvg!: string;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants!: ProductVariant[];

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images!: ProductImage[];

  @OneToMany(() => Review, (r) => r.product)
  reviews!: Review[];
}