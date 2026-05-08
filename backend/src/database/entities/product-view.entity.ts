import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity('product_views')
@Index(['productId', 'viewedAt'])
@Index(['userId', 'viewedAt'])
@Index(['sessionId'])
export class ProductView {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'session_id', type: 'varchar', length: 128, nullable: true })
  sessionId!: string | null;

  @CreateDateColumn({ name: 'viewed_at', type: 'timestamptz' })
  viewedAt!: Date;
}
