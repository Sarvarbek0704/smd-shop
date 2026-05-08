import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { Order } from './order.entity';
import { User } from './user.entity';
import { OrderStatus } from './enums';

@Entity('order_status_history')
export class OrderStatusHistory extends BaseCreatedEntity {
  @ManyToOne(() => Order, (o) => o.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'from_status', type: 'enum', enum: OrderStatus, nullable: true })
  fromStatus!: OrderStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: OrderStatus })
  toStatus!: OrderStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy!: User | null;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedById!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;
}