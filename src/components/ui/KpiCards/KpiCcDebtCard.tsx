import { Icon } from '@/components/ui/Icon';
import { Check } from 'lucide-react';
import { KpiCardShell } from './KpiCardShell';
import { formatKpiMoney } from './formatKpiMoney';
import type { KpiCcDebtData } from './schemas';
import type { KpiCardComponentProps } from './types';

export type KpiCcDebtCardProps = KpiCardComponentProps<KpiCcDebtData>;

export function KpiCcDebtCard({ data, density }: KpiCcDebtCardProps) {
  const isPaidOff = data.paidOff ?? data.amount.amountMinor === 0;

  return (
    <KpiCardShell title={data.title} density={density}>
      <div className="kpi-card__value-row kpi-card__value-row--with-status">
        <span className="kpi-card__value kpi-card__value--money">
          {formatKpiMoney(data.amount)}
        </span>
        {isPaidOff ? (
          <span className="kpi-card__paid-off" aria-label="Paid off">
            <Icon icon={Check} size="md" tone="success" aria-hidden />
          </span>
        ) : null}
      </div>
    </KpiCardShell>
  );
}
