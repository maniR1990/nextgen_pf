'use client';

import type { FundsAggregateSummary } from '@/modules/funds/funds.types';

function formatCompact(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
}

export interface FundHealthSummaryProps {
  summary: FundsAggregateSummary;
  className?: string;
}

export function FundHealthSummary({ summary, className = '' }: FundHealthSummaryProps) {
  const activeFunds = summary.fundHealthRadar.length;
  const onTarget = summary.fundHealthRadar.filter(
    (f) => f.health === 'healthy' || f.health === 'ok',
  ).length;

  return (
    <div className={['fund-health-summary', className].filter(Boolean).join(' ')}>
      <div className="fund-health-summary__stat">
        <span className="fund-health-summary__value">{formatCompact(summary.totalAllocated)}</span>
        <span className="fund-health-summary__label">Total Allocated</span>
      </div>
      <div className="fund-health-summary__stat fund-health-summary__stat--warn">
        <span className="fund-health-summary__value">
          {formatCompact(summary.totalUnallocated)}
        </span>
        <span className="fund-health-summary__label">Idle / Unallocated</span>
      </div>
      <div className="fund-health-summary__stat">
        <span className="fund-health-summary__value">{activeFunds}</span>
        <span className="fund-health-summary__label">Active Funds</span>
      </div>
      <div className="fund-health-summary__stat fund-health-summary__stat--good">
        <span className="fund-health-summary__value">
          {onTarget}/{activeFunds}
        </span>
        <span className="fund-health-summary__label">On Target</span>
      </div>
    </div>
  );
}
