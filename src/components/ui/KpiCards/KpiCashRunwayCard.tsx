import { Icon } from '@/components/ui/Icon';
import { TriangleAlert } from 'lucide-react';
import { KpiCardShell } from './KpiCardShell';
import { KpiProgressBar } from './KpiProgressBar';
import type { KpiCashRunwayData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiCashRunwayCardProps = KpiCardComponentProps<KpiCashRunwayData>;

export function KpiCashRunwayCard({ data, density }: KpiCashRunwayCardProps) {
  const variant = data.variant === 'warning' ? 'warning' : 'default';
  const currentLabel = data.progress.currentLabel ?? `${data.progress.current} ${data.unit}`;
  const targetLabel = data.progress.targetLabel ?? `${data.progress.target} ${data.unit}`;

  return (
    <KpiCardShell
      title={data.title}
      density={density}
      variant={variant}
      titleAdornment={
        variant === 'warning' ? (
          <Icon icon={TriangleAlert} size="sm" tone="warning" aria-label="Warning" />
        ) : null
      }
      footer={<p className="kpi-card__insight">{data.insight}</p>}
    >
      <div className="kpi-card__value-row">
        <span className="kpi-card__value">{data.value}</span>
        <span className="kpi-card__unit">{data.unit}</span>
      </div>
      <KpiProgressBar
        current={data.progress.current}
        target={data.progress.target}
        currentLabel={currentLabel}
        targetLabel={targetLabel}
        variant="warning"
        ariaLabel={`${data.title} progress`}
      />
    </KpiCardShell>
  );
}
