import {
  KPI_CARD_DENSITY,
  KPI_CARD_TYPE,
  type KpiCardDensity,
} from '@/constants/kpiCards';
import { KpiBankCashCard } from './KpiBankCashCard';
import { KpiCashRunwayCard } from './KpiCashRunwayCard';
import { KpiCcDebtCard } from './KpiCcDebtCard';
import { KpiMonthBurnRateCard } from './KpiMonthBurnRateCard';
import { KpiMonthlySurplusCard } from './KpiMonthlySurplusCard';
import { KpiSavingsRateCard } from './KpiSavingsRateCard';
import type { KpiCardItem } from './schemas';

export interface KpiCardRendererProps {
  item: KpiCardItem;
  density?: KpiCardDensity;
}

export function KpiCardRenderer({
  item,
  density = KPI_CARD_DENSITY.COMFORTABLE,
}: KpiCardRendererProps) {
  switch (item.type) {
    case KPI_CARD_TYPE.CASH_RUNWAY:
      return <KpiCashRunwayCard data={item.data} density={density} />;
    case KPI_CARD_TYPE.BANK_CASH:
      return <KpiBankCashCard data={item.data} density={density} />;
    case KPI_CARD_TYPE.MONTHLY_SURPLUS:
      return <KpiMonthlySurplusCard data={item.data} density={density} />;
    case KPI_CARD_TYPE.SAVINGS_RATE:
      return <KpiSavingsRateCard data={item.data} density={density} />;
    case KPI_CARD_TYPE.MONTH_BURN_RATE:
      return <KpiMonthBurnRateCard data={item.data} density={density} />;
    case KPI_CARD_TYPE.CC_DEBT:
      return <KpiCcDebtCard data={item.data} density={density} />;
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

export interface KpiCardsGridProps {
  cards: KpiCardItem[];
  density?: KpiCardDensity;
}

export function kpiDashboardGridClassName({
  density = KPI_CARD_DENSITY.COMFORTABLE,
  className = '',
}: {
  density?: KpiCardDensity;
  className?: string;
}) {
  return [
    'kpi-dashboard-grid',
    density === KPI_CARD_DENSITY.COMPACT && 'kpi-dashboard-grid--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function KpiCardsGrid({
  cards,
  density = KPI_CARD_DENSITY.COMFORTABLE,
}: KpiCardsGridProps) {
  return (
    <div className={kpiDashboardGridClassName({ density })}>
      {cards.map((item, index) => (
        <div
          key={`${item.type}-${index}`}
          className={`kpi-dashboard-grid__item kpi-dashboard-grid__item--${item.type}`}
        >
          <KpiCardRenderer item={item} density={density} />
        </div>
      ))}
    </div>
  );
}
