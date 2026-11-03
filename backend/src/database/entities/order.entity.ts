import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';

import { OrderItem } from './order-item.entity';
import { OrderStatus } from './enums';
import { User } from './user.entity';

@Entity({ name: 'orders' })
@Check('CHK_orders_total_amount_nonnegative', 'total_amount >= 0')
@Index('IDX_orders_user_id', ['userId'])
@Index('IDX_orders_status', ['status'])
@Index('IDX_orders_created_at', ['createdAt'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber!: string;

  @Column({ type: 'enum', enum: OrderStatus, enumName: 'order_status_enum' })
  status!: OrderStatus;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_orders_user_id' })
  user!: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}

