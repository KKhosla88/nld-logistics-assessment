import { HttpError } from '../types/http-error';

export const decimalToCents = (value: string): number => {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new HttpError(500, 'Invalid monetary value');
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new HttpError(500, 'Monetary value is too large');
  return cents;
};

export const centsToDecimal = (cents: number): string => {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new HttpError(500, 'Invalid monetary total');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
};

