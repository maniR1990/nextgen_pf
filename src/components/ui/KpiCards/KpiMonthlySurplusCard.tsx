import { Chip } from '@/components/ui/Chip';
import { formatKpiMoney } from './formatKpiMoney';
import { KpiCardShell } from './KpiCardShell';
import type { KpiMonthlySurplusData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiMonthlySurplusCardProps = KpiCardComponentProps<KpiMonthlySurplusData>;

export function KpiMonthlySurplusCard({ data, density }: KpiMonthlySurplusCardProps) {
  return (
    <KpiCardShell title={data.title} density={density}>
      <div className="kpi-card__value-row">
        <span className="kpi-card__value kpi-card__value--money">
          {formatKpiMoney(data.amount)}
        </span>
      </div>
      <div className="kpi-card__chips">
        {data.actions.map((action) => (
          <Chip key={action.label} variant={action.variant ?? 'brand'} action="none">
            <span className="kpi-card__chip-prefix" aria-hidden>
              →
            </span>{' '}
            {action.label}
          </Chip>
        ))}
      </div>
    </KpiCardShell>
  );
}
