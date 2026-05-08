import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';

@Entity('email_verifications')
@Index(['userId'])
export class EmailVerification extends BaseCreatedEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 128 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'last_sent_at', type: 'timestamptz' })
  lastSentAt!: Date;
}
