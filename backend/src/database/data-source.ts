import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';
import { User } from './entities/user.entity';
import { InitialSchema1730592000000 } from './migrations/1730592000000-initial-schema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  entities: [User, Product, Order, OrderItem],
  migrations: [InitialSchema1730592000000],
  migrationsTableName: 'typeorm_migrations'
});

