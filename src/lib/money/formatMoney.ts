import { DEFAULT_CURRENCY_CODE, DEFAULT_LOCALE } from '@/constants/money';
import { type Dinero, toDecimal } from 'dinero.js';
import { USD } from 'dinero.js/currencies';

export function formatMoney(amount: Dinero<number>, locale: string = DEFAULT_LOCALE): string {
  return toDecimal(amount, ({ value, currency }) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
    }).format(Number(value)),
  );
}

export function formatMoneyFromMinorUnits(
  minorUnits: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
  locale: string = DEFAULT_LOCALE,
): string {
  const currency = currencyCode === 'USD' ? USD : USD;
  const factor = 10 ** currency.exponent;
  const value = minorUnits / factor;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
  }).format(value);
}
