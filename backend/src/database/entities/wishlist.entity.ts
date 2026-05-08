import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';
import { Product } from './product.entity';

@Entity('wishlists')
@Unique(['userId', 'productId'])
export class Wishlist extends BaseCreatedEntity {
  @ManyToOne(() => User, (u) => u.wishlists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;
}
