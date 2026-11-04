import { Router } from 'express';
import { UserAccess } from '../database/entities/enums';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { cancelOrderSchema, createOrderSchema, listOrdersSchema } from './order.schemas';
import { cancelOrder, createOrder, listOrders } from './order.service';

export const orderRouter = Router();
orderRouter.use(authenticate);

orderRouter.post('/', authorize({ accesses: [UserAccess.CREATE] }), validate(createOrderSchema), async (request, response, next) => {
  try {
    const { items } = createOrderSchema.shape.body.parse(request.body);
    response.status(201).json({ order: await createOrder((request as AuthenticatedRequest).user, items) });
  } catch (error) { next(error); }
});

orderRouter.get('/', validate(listOrdersSchema), async (request, response, next) => {
  try {
    const filters = listOrdersSchema.shape.query.parse(request.query);
    response.json(await listOrders((request as AuthenticatedRequest).user, filters));
  } catch (error) { next(error); }
});

orderRouter.post('/:id/cancel', authorize({ accesses: [UserAccess.CREATE] }), validate(cancelOrderSchema), async (request, response, next) => {
  try {
    const { id } = cancelOrderSchema.shape.params.parse(request.params);
    response.json({ order: await cancelOrder((request as AuthenticatedRequest).user, id) });
  } catch (error) { next(error); }
});

