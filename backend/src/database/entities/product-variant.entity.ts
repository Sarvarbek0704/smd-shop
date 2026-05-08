import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant extends BaseCreatedEntity {
  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'price_modifier', type: 'numeric', precision: 12, scale: 2, default: 0 })
  priceModifier!: string;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity!: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  attributes!: Record<string, unknown>;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}