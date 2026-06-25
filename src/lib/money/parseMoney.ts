import { DEFAULT_CURRENCY_CODE } from '@/constants/money';
import currency from 'currency.js';
import { type Dinero, dinero } from 'dinero.js';
import { USD } from 'dinero.js/currencies';

function resolveCurrency(currencyCode: string) {
  return currencyCode === 'USD' ? USD : USD;
}

/** Parse a user-facing money string into a Dinero instance (minor units). */
export function parseMoney(
  input: string,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
): Dinero<number> {
  const resolved = resolveCurrency(currencyCode);
  const sanitized = input.trim();
  const parsed = currency(sanitized, { symbol: '' }).value;
  const factor = 10 ** resolved.exponent;
  return dinero({
    amount: Math.round(parsed * factor),
    currency: resolved,
  });
}

/** Parse a decimal number into Dinero minor units. */
export function moneyFromDecimal(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
): Dinero<number> {
  const resolved = resolveCurrency(currencyCode);
  const factor = 10 ** resolved.exponent;
  return dinero({
    amount: Math.round(amount * factor),
    currency: resolved,
  });
}
