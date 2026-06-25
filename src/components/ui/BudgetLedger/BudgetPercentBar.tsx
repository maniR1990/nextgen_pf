import type { HTMLAttributes } from 'react';

export type BudgetPercentTone = 'brand' | 'success' | 'warning' | 'error';

export interface BudgetPercentBarProps extends HTMLAttributes<HTMLDivElement> {
  percent: number;
  label?: string;
}

export function resolveBudgetPercentTone(percent: number): BudgetPercentTone {
  if (percent >= 100) return 'error';
  if (percent >= 90) return 'warning';
  if (percent >= 70) return 'brand';
  return 'success';
}

export function budgetPercentBarClassName({
  tone,
  className = '',
}: {
  tone: BudgetPercentTone;
  className?: string;
}) {
  return ['budget-ledger__percent', `budget-ledger__percent--${tone}`, className]
    .filter(Boolean)
    .join(' ');
}

export function BudgetPercentBar({
  percent,
  label,
  className = '',
  ...props
}: BudgetPercentBarProps) {
  const tone = resolveBudgetPercentTone(percent);
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      className={budgetPercentBarClassName({ tone, className })}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}% of budget used`}
      {...props}
    >
      <div className="budget-ledger__percent-track">
        <div className="budget-ledger__percent-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="budget-ledger__percent-value">{clamped}%</span>
    </div>
  );
}
