import { Badge } from '@/components/ui/Badge';
import { KpiCardShell } from './KpiCardShell';
import { KpiProgressBar } from './KpiProgressBar';
import { formatKpiMoney } from './formatKpiMoney';
import type { KpiMonthBurnRateData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiMonthBurnRateCardProps = KpiCardComponentProps<KpiMonthBurnRateData>;

const BUDGET_STATUS_VARIANT = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'inactive',
} as const;

const PROGRESS_VARIANT = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'brand',
} as const;

export function KpiMonthBurnRateCard({ data, density }: KpiMonthBurnRateCardProps) {
  const currentLabel = data.progress.currentLabel ?? formatKpiMoney(data.amount);
  const targetLabel = data.progress.targetLabel ?? `${data.progress.target}`;

  return (
    <KpiCardShell title={data.title} density={density}>
      <div className="kpi-card__value-row kpi-card__value-row--stacked">
        <span className="kpi-card__value kpi-card__value--money">
          {formatKpiMoney(data.amount)}
        </span>
        <span className="kpi-card__subvalue">{data.spentLabel}</span>
      </div>
      <KpiProgressBar
        current={data.progress.current}
        target={data.progress.target}
        currentLabel={currentLabel}
        targetLabel={targetLabel}
        variant={PROGRESS_VARIANT[data.budgetStatus.variant]}
        ariaLabel={`${data.title} budget progress`}
      />
      <div className="kpi-card__status-row">
        <span className="kpi-card__meta-line">{data.dayLabel}</span>
        <Badge variant={BUDGET_STATUS_VARIANT[data.budgetStatus.variant]}>
          {data.budgetStatus.label}
        </Badge>
      </div>
    </KpiCardShell>
  );
}
