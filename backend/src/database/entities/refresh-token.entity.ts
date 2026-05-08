import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index(['userId'])
@Index(['tokenHash'], { unique: true })
export class RefreshToken extends BaseCreatedEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({
    name: 'replaced_by_token_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  replacedByTokenHash!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;
}
