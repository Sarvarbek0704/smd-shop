import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CouponType } from './enums';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'enum', enum: CouponType })
  type!: CouponType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  value!: string;

  @Column({ name: 'min_order_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  minOrderAmount!: string | null;

  @Column({ name: 'max_discount_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  maxDiscountAmount!: string | null;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit!: number | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom!: Date | null;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}