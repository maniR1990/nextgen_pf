import type { AppHeaderData, PulseMetric } from '@/lib/schemas/appHeader';
import { formatINR, formatINRCompact } from './format';

export function formatMetricValue(metric: PulseMetric, data: AppHeaderData): string {
  const raw = data[metric.dataKey as keyof AppHeaderData];
  const value = typeof raw === 'number' ? raw : 0;
  switch (metric.format) {
    case 'currency-inr-compact':
      return formatINRCompact(value);
    case 'currency-inr':
      return formatINR(value);
    case 'days':
      return String(value);
    default:
      return String(raw ?? '—');
  }
}
