'use client';

import type { BudgetImpact } from '@/types/finance';

interface BudgetImpactStripProps {
  impact: BudgetImpact | null;
}

export function BudgetImpactStrip({ impact }: BudgetImpactStripProps) {
  if (!impact) return null;

  const { categoryLabel, planned, thisTx, remaining, percentUsed, state } = impact;

  const fmt = (n: number) =>
    `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className={`budget-strip budget-strip--${state}`} role="status" aria-live="polite">
      <div className="budget-strip__header">
        <span className="budget-strip__label">{categoryLabel} budget</span>
        <span className="budget-strip__percent">{percentUsed}% used</span>
      </div>

      <div className="budget-strip__bar">
        <div
          className="budget-strip__fill"
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
          aria-hidden
        />
      </div>

      <div className="budget-strip__meta">
        <span>Plan {fmt(planned)}</span>
        <span className="budget-strip__this-tx">+{fmt(thisTx)} this tx</span>
        <span className={remaining < 0 ? 'budget-strip__over' : ''}>
          {remaining < 0 ? `${fmt(remaining)} over` : `${fmt(remaining)} left`}
        </span>
      </div>
    </div>
  );
}
