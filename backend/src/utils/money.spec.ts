import { centsToDecimal, decimalToCents } from './money';

describe('money utilities', () => {
  it.each([['0.01', 1], ['12.99', 1299], ['28.5', 2850]])('converts %s exactly to cents', (value, cents) => {
    expect(decimalToCents(value)).toBe(cents);
  });

  it('converts cents to a two-decimal database value', () => {
    expect(centsToDecimal(1305)).toBe('13.05');
  });
});

