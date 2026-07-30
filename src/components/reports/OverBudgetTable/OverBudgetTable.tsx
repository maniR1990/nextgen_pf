'use client';

import type { BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { formatINR } from '@/lib/utils/format';

// ─── Inner (pure presentational) ─────────────────────────────────────────────

export interface OverBudgetTableInnerProps {
  data: BudgetFlagsResult;
}

export function OverBudgetTableInner({ data }: OverBudgetTableInnerProps) {
  if (data.overBudget.length === 0) return null;

  return (
    <section className="over-budget-table" aria-label="Over-budget categories">
      <h2 className="over-budget-table__title">Over-Budget Breakdown</h2>
      <div className="over-budget-table__scroll">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Item / Subcategory</th>
              <th className="over-budget-table__num-head">Excess Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Already sorted descending by excess amount — see ReportsService.getBudgetFlags. */}
            {data.overBudget.map((c) => (
              <tr key={c.id}>
                <td>{c.parentName ?? c.name}</td>
                <td>{c.parentName ? c.name : '—'}</td>
                <td className="over-budget-table__excess">{formatINR(c.over)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface OverBudgetTableProps {
  year: number;
  month: number;
}

export function OverBudgetTable({ year, month }: OverBudgetTableProps) {
  const { data, isLoading } = useBudgetFlags(year, month);

  // Nothing to say yet (still loading) and nothing over budget (handled inside Inner)
  // both render nothing — an empty table is exactly the "unwanted spacing" to avoid.
  if (isLoading || !data) return null;
  return <OverBudgetTableInner data={data} />;
}
