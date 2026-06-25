import { Icon } from '@/components/ui/Icon';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { formatKpiMoney, formatKpiTrendAmount } from './formatKpiMoney';
import { KpiCardShell } from './KpiCardShell';
import { KpiSparkline } from './KpiSparkline';
import type { KpiBankCashData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiBankCashCardProps = KpiCardComponentProps<KpiBankCashData>;

const TREND_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
} as const;

const TREND_CLASS = {
  up: 'kpi-card__trend--up',
  down: 'kpi-card__trend--down',
  flat: 'kpi-card__trend--flat',
} as const;

export function KpiBankCashCard({ data, density }: KpiBankCashCardProps) {
  const TrendIcon = TREND_ICON[data.trend.direction];
  const trendAmount = formatKpiTrendAmount(
    Math.abs(data.trend.amountMinor),
    data.amount.currency,
  );

  return (
    <KpiCardShell
      title={data.title}
      density={density}
      footer={
        <p className={`kpi-card__trend ${TREND_CLASS[data.trend.direction]}`}>
          <Icon icon={TrendIcon} size="xs" tone="inherit" aria-hidden />
          <span>
            {data.trend.direction === 'down' ? '−' : data.trend.direction === 'up' ? '+' : ''}
            {trendAmount} vs {data.trend.periodLabel}
          </span>
        </p>
      }
    >
      <div className="kpi-card__value-row kpi-card__value-row--with-chart">
        <span className="kpi-card__value kpi-card__value--money">
          {formatKpiMoney(data.amount)}
        </span>
        <KpiSparkline values={data.sparkline} ariaLabel={`${data.title} trend`} />
      </div>
    </KpiCardShell>
  );
}
