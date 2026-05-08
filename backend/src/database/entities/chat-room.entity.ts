import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';
import { Product } from './product.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
@Unique(['productId', 'buyerId', 'sellerId'])
@Index(['buyerId'])
@Index(['sellerId'])
export class ChatRoom extends BaseCreatedEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId!: string;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  @OneToMany(() => ChatMessage, (m) => m.room)
  messages!: ChatMessage[];
}
