import 'reflect-metadata';

import { AppDataSource } from '../database/data-source';
import { Order } from '../database/entities/order.entity';
import { UserAccess, UserRole } from '../database/entities/enums';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { cancelOrder, createOrder } from '../orders/order.service';

const verificationEmail = 'concurrency-verifier@nld.local';

async function verify(): Promise<void> {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User);
  const products = AppDataSource.getRepository(Product);
  const orders = AppDataSource.getRepository(Order);
  let user: User | null = null;
  let product: Product | null = null;
  let originalStock = 0;

  try {
    const staleUser = await users.findOne({ where: { email: verificationEmail } });
    if (staleUser) {
      await orders.delete({ userId: staleUser.id });
      await users.delete(staleUser.id);
    }
    user = await users.save(users.create({
      email: verificationEmail,
      passwordHash: 'not-a-login-account',
      role: UserRole.USER,
      access: UserAccess.CREATE
    }));
    product = await products.findOneByOrFail({ sku: 'BOX-SM-001' });
    originalStock = product.stockQty;
    product.stockQty = 1;
    await products.save(product);

    const actor = { id: user.id, role: user.role, access: user.access };
    const creations = await Promise.allSettled([
      createOrder(actor, [{ productId: product.id, quantity: 1 }]),
      createOrder(actor, [{ productId: product.id, quantity: 1 }])
    ]);
    const created = creations.filter((result): result is PromiseFulfilledResult<Order> => result.status === 'fulfilled');
    const rejected = creations.filter((result) => result.status === 'rejected');
    if (created.length !== 1 || rejected.length !== 1) throw new Error('Expected exactly one concurrent order to succeed');
    const createdOrder = created[0];
    if (!createdOrder) throw new Error('No order was created');
    if ((await products.findOneByOrFail({ id: product.id })).stockQty !== 0) throw new Error('Stock was not deducted exactly once');

    const cancellations = await Promise.allSettled([
      cancelOrder(actor, createdOrder.value.id),
      cancelOrder(actor, createdOrder.value.id)
    ]);
    if (cancellations.filter((result) => result.status === 'fulfilled').length !== 1) throw new Error('Expected exactly one cancellation to succeed');
    if ((await products.findOneByOrFail({ id: product.id })).stockQty !== 1) throw new Error('Stock was not restored exactly once');

    console.log('Concurrency verified: one order, one rejection, one cancellation, one rejection.');
  } finally {
    if (user) await orders.delete({ userId: user.id });
    if (product) await products.update(product.id, { stockQty: originalStock });
    if (user) await users.delete(user.id);
    await AppDataSource.destroy();
  }
}

verify().catch((error: unknown) => {
  console.error('Concurrency verification failed.', error);
  process.exitCode = 1;
});

