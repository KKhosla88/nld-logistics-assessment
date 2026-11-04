import { randomUUID } from 'node:crypto';
import { In, type EntityManager, type SelectQueryBuilder } from 'typeorm';

import { AppDataSource } from '../database/data-source';
import { OrderItem } from '../database/entities/order-item.entity';
import { Order } from '../database/entities/order.entity';
import { OrderStatus, UserRole } from '../database/entities/enums';
import { Product } from '../database/entities/product.entity';
import type { AuthenticatedUser } from '../types/authenticated-request';
import { HttpError } from '../types/http-error';
import { centsToDecimal, decimalToCents } from '../utils/money';

export interface RequestedItem { productId: number; quantity: number; }

const lockProducts = async (manager: EntityManager, ids: number[]): Promise<Product[]> =>
  manager.getRepository(Product).createQueryBuilder('product')
    .where('product.id IN (:...ids)', { ids: [...ids].sort((a, b) => a - b) })
    .orderBy('product.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

export const createOrder = (user: AuthenticatedUser, requestedItems: RequestedItem[]): Promise<Order> =>
  AppDataSource.transaction(async (manager) => {
    const products = await lockProducts(manager, requestedItems.map((item) => item.productId));
    if (products.length !== requestedItems.length) throw new HttpError(404, 'One or more products do not exist');

    const productsById = new Map(products.map((product) => [product.id, product]));
    let totalCents = 0;
    for (const item of requestedItems) {
      const product = productsById.get(item.productId)!;
      if (product.stockQty < item.quantity) throw new HttpError(409, `Insufficient stock for ${product.name}`);
      product.stockQty -= item.quantity;
      totalCents += decimalToCents(product.price) * item.quantity;
      if (!Number.isSafeInteger(totalCents)) throw new HttpError(400, 'Order total is too large');
    }

    await manager.getRepository(Product).save(products);
    const order = await manager.getRepository(Order).save(manager.getRepository(Order).create({
      userId: user.id,
      orderNumber: `NLD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: OrderStatus.PENDING,
      totalAmount: centsToDecimal(totalCents)
    }));
    order.items = await manager.getRepository(OrderItem).save(requestedItems.map((item) => {
      const product = productsById.get(item.productId)!;
      return manager.getRepository(OrderItem).create({ orderId: order.id, productId: product.id, quantity: item.quantity, unitPrice: product.price });
    }));
    return order;
  });

const applyOrderFilters = (query: SelectQueryBuilder<Order>, user: AuthenticatedUser, filters: { status?: OrderStatus; from?: string; to?: string }): void => {
  if (user.role !== UserRole.ADMIN) query.andWhere('order.user_id = :userId', { userId: user.id });
  if (filters.status) query.andWhere('order.status = :status', { status: filters.status });
  if (filters.from) query.andWhere('order.created_at >= :from', { from: filters.from.length === 10 ? `${filters.from}T00:00:00.000Z` : filters.from });
  if (filters.to) query.andWhere('order.created_at <= :to', { to: filters.to.length === 10 ? `${filters.to}T23:59:59.999Z` : filters.to });
};

export const listOrders = async (user: AuthenticatedUser, filters: { status?: OrderStatus; from?: string; to?: string; page: number; limit: number }) => {
  const query = AppDataSource.getRepository(Order).createQueryBuilder('order')
    .loadRelationCountAndMap('order.itemCount', 'order.items')
    .orderBy('order.created_at', 'DESC').addOrderBy('order.id', 'DESC')
    .skip((filters.page - 1) * filters.limit).take(filters.limit);
  applyOrderFilters(query, user, filters);
  const [orders, total] = await query.getManyAndCount();
  return { data: orders, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
};

export const cancelOrder = (user: AuthenticatedUser, orderId: number): Promise<Order> =>
  AppDataSource.transaction(async (manager) => {
    const order = await manager.getRepository(Order).createQueryBuilder('order')
      .where('order.id = :orderId', { orderId }).setLock('pessimistic_write').getOne();
    if (!order) throw new HttpError(404, 'Order not found');
    if (user.role !== UserRole.ADMIN && order.userId !== user.id) throw new HttpError(404, 'Order not found');
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) throw new HttpError(409, 'Order cannot be cancelled in its current status');

    const items = await manager.getRepository(OrderItem).find({ where: { orderId } });
    const products = await lockProducts(manager, items.map((item) => item.productId));
    const productsById = new Map(products.map((product) => [product.id, product]));
    for (const item of items) productsById.get(item.productId)!.stockQty += item.quantity;
    await manager.getRepository(Product).save(products);
    order.status = OrderStatus.CANCELLED;
    return manager.getRepository(Order).save(order);
  });

