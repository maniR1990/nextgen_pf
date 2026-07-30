'use client';

import type { BudgetFlagCategory, BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { formatINR } from '@/lib/utils/format';

function categoryLabel(c: BudgetFlagCategory): string {
  return c.parentName ? `${c.parentName} › ${c.name}` : c.name;
}

// ─── Inner (pure presentational) ─────────────────────────────────────────────

export interface ReportBudgetAlertsInnerProps {
  data: BudgetFlagsResult;
}

export function ReportBudgetAlertsInner({ data }: ReportBudgetAlertsInnerProps) {
  const hasUnplanned = data.unplanned.length > 0;
  const hasOverBudget = data.overBudget.length > 0;
  if (!hasUnplanned && !hasOverBudget) return null;

  return (
    <section className="budget-alerts" aria-label="Budget alerts">
      {hasUnplanned && (
        <div className="budget-alerts__group">
          <div className="budget-alerts__heading">
            <span className="budget-alerts__title">Unplanned spend</span>
            <span className="budget-alerts__total">{formatINR(data.unplannedTotal)}</span>
          </div>
          <ul className="budget-alerts__list">
            {data.unplanned.map((c) => (
              <li key={c.id} className="budget-alerts__row">
                <span className="budget-alerts__name">{categoryLabel(c)}</span>
                <span className="budget-alerts__amount">{formatINR(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasOverBudget && (
        <div className="budget-alerts__group">
          <div className="budget-alerts__heading">
            <span className="budget-alerts__title">Over budget</span>
            <span className="budget-alerts__total budget-alerts__total--over">
              +{formatINR(data.overBudgetTotal)}
            </span>
          </div>
          <ul className="budget-alerts__list">
            {data.overBudget.map((c) => (
              <li key={c.id} className="budget-alerts__row">
                <span className="budget-alerts__name">{categoryLabel(c)}</span>
                <span className="budget-alerts__amount budget-alerts__amount--over">
                  +{formatINR(c.over)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface ReportBudgetAlertsProps {
  year: number;
  month: number;
}

export function ReportBudgetAlerts({ year, month }: ReportBudgetAlertsProps) {
  const { data, isLoading } = useBudgetFlags(year, month);

  // Nothing to say yet (still loading) and nothing to flag (both lists empty, handled
  // inside Inner) both render nothing — an empty alerts box is exactly the "unwanted
  // spacing" this panel exists to avoid.
  if (isLoading || !data) return null;
  return <ReportBudgetAlertsInner data={data} />;
}
