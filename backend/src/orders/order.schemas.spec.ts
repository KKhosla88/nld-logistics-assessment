import { createOrderSchema, listOrdersSchema } from './order.schemas';

describe('order request schemas', () => {
  it('accepts the assessment SKU and qty contract', () => {
    expect(createOrderSchema.safeParse({ body: { items: [
      { sku: 'SKU001', qty: 2 }, { sku: 'SKU002', qty: 1 }
    ] } }).success).toBe(true);
  });

  it('rejects duplicate SKUs', () => {
    expect(createOrderSchema.safeParse({ body: { items: [
      { sku: 'SKU001', qty: 1 }, { sku: 'SKU001', qty: 2 }
    ] } }).success).toBe(false);
  });

  it('rejects non-positive quantities', () => {
    expect(createOrderSchema.safeParse({ body: { items: [{ sku: 'SKU001', qty: 0 }] } }).success).toBe(false);
  });

  it('rejects an inverted date range', () => {
    expect(listOrdersSchema.safeParse({ query: { from: '2026-11-04', to: '2026-11-01' } }).success).toBe(false);
  });
});
