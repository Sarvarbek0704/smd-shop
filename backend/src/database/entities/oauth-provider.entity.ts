import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';
import { User } from './user.entity';
import { OauthProvider } from './enums';

@Entity('oauth_providers')
@Index(['provider', 'providerId'], { unique: true })
export class OauthProviderEntity extends BaseCreatedEntity {
  @ManyToOne(() => User, (user) => user.oauthProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: OauthProvider })
  provider!: OauthProvider;

  @Column({ name: 'provider_id', type: 'varchar', length: 255 })
  providerId!: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken!: string | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken!: string | null;
}