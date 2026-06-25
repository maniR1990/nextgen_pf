import { KPI_DEFAULT_CURRENCY, KPI_DEFAULT_LOCALE } from '@/constants/kpiCards';
import { formatKpiMoney } from '@/components/ui/KpiCards/formatKpiMoney';

export function formatBudgetMoney(
  amountMinor: number,
  currency: string = KPI_DEFAULT_CURRENCY,
  locale: string = KPI_DEFAULT_LOCALE,
): string {
  return formatKpiMoney({ amountMinor, currency }, locale);
}
