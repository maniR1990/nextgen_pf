import type { KpiCardDensity } from '@/constants/kpiCards';

export interface KpiCardComponentProps<TData> {
  data: TData;
  density?: KpiCardDensity;
}
