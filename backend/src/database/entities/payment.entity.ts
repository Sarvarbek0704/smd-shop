import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { PaymentMethod, TransactionStatus, CancelReason } from './enums';

@Entity('payments')
@Index(['orderId'])
@Index(['status'])
@Index(['provider'])
export class Payment extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (o) => o.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  provider!: PaymentMethod;

  @Column({
    name: 'external_tx_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    unique: true,
  })
  externalTxId!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ name: 'performed_at', type: 'timestamptz', nullable: true })
  performedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancel_reason', type: 'int', nullable: true })
  cancelReason!: CancelReason | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt!: Date | null;
}
