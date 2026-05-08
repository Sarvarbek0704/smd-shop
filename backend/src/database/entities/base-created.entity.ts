import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseCreatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}