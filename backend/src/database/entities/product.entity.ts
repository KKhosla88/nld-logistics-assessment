import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';

import { OrderItem } from './order-item.entity';

@Entity({ name: 'products' })
@Check('CHK_products_stock_qty_nonnegative', 'stock_qty >= 0')
@Check('CHK_products_price_nonnegative', 'price >= 0')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ name: 'stock_qty', type: 'integer' })
  stockQty!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];
}

