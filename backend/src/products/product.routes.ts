import { Router } from 'express';

import { AppDataSource } from '../database/data-source';
import { Product } from '../database/entities/product.entity';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { listProductsSchema } from './product.schemas';

export const productRouter = Router();

productRouter.get('/', authenticate, validate(listProductsSchema), async (request, response, next) => {
  try {
    const { search, page, limit } = listProductsSchema.shape.query.parse(request.query);
    const query = AppDataSource.getRepository(Product)
      .createQueryBuilder('product')
      .orderBy('product.name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.where('product.name ILIKE :search OR product.sku ILIKE :search', { search: `%${search}%` });
    }

    const [products, total] = await query.getManyAndCount();
    response.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    next(error);
  }
});

