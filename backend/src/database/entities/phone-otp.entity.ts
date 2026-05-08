import { Column, Entity, Index } from 'typeorm';
import { BaseCreatedEntity } from './base-created.entity';

export enum OtpPurpose {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
}

@Entity('phone_otps')
@Index(['phone', 'purpose'])
export class PhoneOtp extends BaseCreatedEntity {
  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 128 })
  codeHash!: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose!: OtpPurpose;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'last_sent_at', type: 'timestamptz' })
  lastSentAt!: Date;
}
