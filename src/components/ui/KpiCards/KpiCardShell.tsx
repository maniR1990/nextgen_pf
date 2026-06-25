import { Card } from '@/components/ui/Card';
import { KPI_CARD_DENSITY, type KpiCardDensity } from '@/constants/kpiCards';
import type { ReactNode } from 'react';

export type KpiCardShellVariant = 'default' | 'warning';

const VARIANT_CLASS: Record<KpiCardShellVariant, string> = {
  default: '',
  warning: 'kpi-card--warning',
};

const DENSITY_CLASS: Record<KpiCardDensity, string> = {
  [KPI_CARD_DENSITY.COMFORTABLE]: '',
  [KPI_CARD_DENSITY.COMPACT]: 'kpi-card--compact',
};

export function kpiCardClassName({
  variant = 'default',
  density = KPI_CARD_DENSITY.COMFORTABLE,
  className = '',
}: {
  variant?: KpiCardShellVariant;
  density?: KpiCardDensity;
  className?: string;
}) {
  return ['kpi-card', VARIANT_CLASS[variant], DENSITY_CLASS[density], className]
    .filter(Boolean)
    .join(' ');
}

export interface KpiCardShellProps {
  title: string;
  titleAdornment?: ReactNode;
  variant?: KpiCardShellVariant;
  density?: KpiCardDensity;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function KpiCardShell({
  title,
  titleAdornment,
  variant = 'default',
  density = KPI_CARD_DENSITY.COMFORTABLE,
  className = '',
  children,
  footer,
}: KpiCardShellProps) {
  return (
    <Card className={kpiCardClassName({ variant, density, className })}>
      <div className="kpi-card__header">
        <h3 className="kpi-card__title type-label">{title}</h3>
        {titleAdornment ? <div className="kpi-card__adornment">{titleAdornment}</div> : null}
      </div>
      <div className="kpi-card__body">{children}</div>
      {footer ? <div className="kpi-card__footer">{footer}</div> : null}
    </Card>
  );
}
