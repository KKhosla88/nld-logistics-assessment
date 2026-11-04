import { z } from 'zod';
import { OrderStatus } from '../database/entities/enums';

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive().max(10_000)
    }).strict()).min(1).max(100)
  }).strict().superRefine(({ items }, context) => {
    const seen = new Set<number>();
    items.forEach((item, index) => {
      if (seen.has(item.productId)) context.addIssue({ code: 'custom', message: 'Duplicate product IDs are not allowed', path: ['items', index, 'productId'] });
      seen.add(item.productId);
    });
  })
});

const dateInput = z.string().refine((value) =>
  (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value))
  && !Number.isNaN(Date.parse(value)), 'Use a valid UTC date or ISO timestamp');

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    from: dateInput.optional(),
    to: dateInput.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  }).superRefine(({ from, to }, context) => {
    if (from && to && Date.parse(from) > Date.parse(to)) context.addIssue({ code: 'custom', message: 'from must not be after to', path: ['from'] });
  })
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() })
});

