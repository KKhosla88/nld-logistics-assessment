import { createOrderSchema, listOrdersSchema } from './order.schemas';

describe('order request schemas', () => {
  it('rejects duplicate product IDs', () => {
    expect(createOrderSchema.safeParse({ body: { items: [
      { productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }
    ] } }).success).toBe(false);
  });

  it('rejects non-positive quantities', () => {
    expect(createOrderSchema.safeParse({ body: { items: [{ productId: 1, quantity: 0 }] } }).success).toBe(false);
  });

  it('rejects an inverted date range', () => {
    expect(listOrdersSchema.safeParse({ query: { from: '2026-11-04', to: '2026-11-01' } }).success).toBe(false);
  });
});
