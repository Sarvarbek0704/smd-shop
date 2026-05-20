import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const url = process.env.DATABASE_URL;

export const AppDataSource = url
  ? new DataSource({
      type: 'postgres',
      url,
      ssl: { rejectUnauthorized: false },
      entities: ['src/database/entities/*.entity.ts'],
      migrations: ['src/database/migrations/*.ts'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: false,
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'online_shop',
      entities: ['src/database/entities/*.entity.ts'],
      migrations: ['src/database/migrations/*.ts'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: false,
    });
