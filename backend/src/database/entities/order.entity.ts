import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { Delivery } from './delivery.entity';
import { Payment } from './payment.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from './enums';

@Entity('orders')
@Index(['buyerId'])
@Index(['sellerId'])
@Index(['status'])
export class Order extends BaseEntity {
  @Column({ name: 'order_number', type: 'varchar', length: 32, unique: true })
  orderNumber!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount!: string;

  @Column({
    name: 'discount_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  discountAmount!: string;

  @Column({ name: 'final_amount', type: 'numeric', precision: 14, scale: 2 })
  finalAmount!: string;

  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress!: {
    region: string;
    city: string;
    street: string;
    zip?: string;
    [key: string]: unknown;
  };

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    name: 'payment_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  paymentTransactionId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason!: string | null;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order)
  statusHistory!: OrderStatusHistory[];

  @OneToOne(() => Delivery, (d) => d.order)
  delivery!: Delivery;

  @OneToMany(() => Payment, (p) => p.order)
  payments!: Payment[];
}
