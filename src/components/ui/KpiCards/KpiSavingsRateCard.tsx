import { Badge } from '@/components/ui/Badge';
import { KpiCardShell } from './KpiCardShell';
import { KpiMiniDonut } from './KpiMiniDonut';
import type { KpiSavingsRateData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiSavingsRateCardProps = KpiCardComponentProps<KpiSavingsRateData>;

const BENCHMARK_VARIANT = {
  above: 'success',
  below: 'warning',
  'on-track': 'active',
} as const;

export function KpiSavingsRateCard({ data, density }: KpiSavingsRateCardProps) {
  return (
    <KpiCardShell title={data.title} density={density}>
      <div className="kpi-card__savings-layout">
        <KpiMiniDonut
          percent={data.ratePercent}
          ariaLabel={`${data.title}: ${data.ratePercent}%`}
        />
        <div className="kpi-card__savings-meta">
          <span className="kpi-card__value kpi-card__value--percent">{data.ratePercent}%</span>
          <p className="kpi-card__meta-line">
            Target <span className="kpi-card__meta-strong">{data.targetPercent}%</span>
          </p>
          <Badge variant={BENCHMARK_VARIANT[data.benchmark.status]}>{data.benchmark.label}</Badge>
        </div>
      </div>
    </KpiCardShell>
  );
}
