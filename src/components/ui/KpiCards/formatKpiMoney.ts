import { KPI_DEFAULT_CURRENCY, KPI_DEFAULT_LOCALE } from '@/constants/kpiCards';
import { formatMoney } from '@/lib/money';
import { dinero } from 'dinero.js';
import { INR, USD } from 'dinero.js/currencies';
import type { KpiMoneyAmount } from './schemas';

function resolveCurrency(code: string) {
  return code === 'INR' ? INR : USD;
}

export function formatKpiMoney(
  amount: KpiMoneyAmount,
  locale: string = KPI_DEFAULT_LOCALE,
): string {
  const currency = resolveCurrency(amount.currency ?? KPI_DEFAULT_CURRENCY);
  return formatMoney(dinero({ amount: amount.amountMinor, currency }), locale);
}

export function formatKpiTrendAmount(
  amountMinor: number,
  currencyCode: string = KPI_DEFAULT_CURRENCY,
  locale: string = KPI_DEFAULT_LOCALE,
): string {
  return formatKpiMoney({ amountMinor, currency: currencyCode }, locale);
}
