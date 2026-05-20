import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { OauthProviderEntity } from './oauth-provider.entity';
import { Product } from './product.entity';
import { Cart } from './cart.entity';
import { Wishlist } from './wishlist.entity';
import { Notification } from './notification.entity';
import { SellerStatus } from './enums';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true, where: '"email" IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Index({ unique: true, where: '"phone" IS NOT NULL' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_demo', type: 'boolean', default: false })
  isDemo!: boolean;

  @Column({
    name: 'seller_status',
    type: 'enum',
    enum: SellerStatus,
    nullable: true,
  })
  sellerStatus!: SellerStatus | null;

  @Column({ name: 'store_name', type: 'varchar', length: 100, nullable: true })
  storeName!: string | null;

  @Column({ name: 'store_description', type: 'text', nullable: true })
  storeDescription!: string | null;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason!: string | null;

  @ManyToMany(() => Role, (role) => role.users, { cascade: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => OauthProviderEntity, (op) => op.user)
  oauthProviders!: OauthProviderEntity[];

  @OneToMany(() => Product, (p) => p.seller)
  products!: Product[];

  @OneToOne(() => Cart, (c) => c.user)
  cart!: Cart | null;

  @OneToMany(() => Wishlist, (w) => w.user)
  wishlists!: Wishlist[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];
}
