import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';

@Entity('password_resets')
@Index(['tokenHash'], { unique: true })
@Index(['userId'])
export class PasswordReset extends BaseCreatedEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;
}
