import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { User } from './user.entity';
import { DeliveryStatus } from './enums';

@Entity('deliveries')
export class Delivery extends BaseEntity {
  @OneToOne(() => Order, (o) => o.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courier_id' })
  courier!: User | null;

  @Column({ name: 'courier_id', type: 'uuid', nullable: true })
  courierId!: string | null;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.WAITING })
  status!: DeliveryStatus;

  @Column({ name: 'pickup_address', type: 'jsonb' })
  pickupAddress!: Record<string, unknown>;

  @Column({ name: 'delivery_address', type: 'jsonb' })
  deliveryAddress!: Record<string, unknown>;

  @Column({ name: 'estimated_at', type: 'timestamptz', nullable: true })
  estimatedAt!: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}