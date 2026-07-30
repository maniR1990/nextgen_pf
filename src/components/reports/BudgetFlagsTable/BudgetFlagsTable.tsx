'use client';

import type { BudgetFlagCategory, BudgetFlagsResult, OverBudgetCategory } from '@/hooks/useBudgetFlags';
import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { formatINR } from '@/lib/utils/format';
import { useState } from 'react';

type Tab = 'over-budget' | 'unplanned';

function categoryCell(c: BudgetFlagCategory): string {
  return c.parentName ?? c.name;
}

function itemCell(c: BudgetFlagCategory): string {
  return c.parentName ? c.name : '—';
}

function OverBudgetRows({ rows }: { rows: OverBudgetCategory[] }) {
  return (
    <>
      {rows.map((c) => (
        <tr key={c.id}>
          <td>{categoryCell(c)}</td>
          <td>{itemCell(c)}</td>
          <td className="budget-flags-table__excess">{formatINR(c.over, 2)}</td>
        </tr>
      ))}
    </>
  );
}

function UnplannedRows({ rows }: { rows: BudgetFlagCategory[] }) {
  return (
    <>
      {rows.map((c) => (
        <tr key={c.id}>
          <td>{categoryCell(c)}</td>
          <td>{itemCell(c)}</td>
          <td className="budget-flags-table__amount">{formatINR(c.amount, 2)}</td>
        </tr>
      ))}
    </>
  );
}

// ─── Inner (pure presentational) ─────────────────────────────────────────────

export interface BudgetFlagsTableInnerProps {
  data: BudgetFlagsResult;
}

export function BudgetFlagsTableInner({ data }: BudgetFlagsTableInnerProps) {
  const hasOverBudget = data.overBudget.length > 0;
  const hasUnplanned = data.unplanned.length > 0;
  // Land on whichever tab actually has something to show — a fresh page load that
  // defaults to an empty "Over-Budget Breakdown" when only Unplanned has rows would
  // read as "nothing to flag this month" when that's not true.
  const [tab, setTab] = useState<Tab>(hasOverBudget ? 'over-budget' : 'unplanned');

  if (!hasOverBudget && !hasUnplanned) return null;

  const isOverBudget = tab === 'over-budget';
  const rows = isOverBudget ? data.overBudget : data.unplanned;
  const amountHeader = isOverBudget ? 'Excess Amount' : 'Amount';
  const emptyMessage = isOverBudget
    ? 'Nothing is over budget this month.'
    : 'No unplanned spend this month.';

  return (
    <section className="budget-flags-table" aria-label="Budget flags">
      <div className="budget-flags-table__tabs" role="tablist" aria-label="Budget flags view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'over-budget'}
          className={[
            'budget-flags-table__tab',
            tab === 'over-budget' && 'budget-flags-table__tab--active',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('over-budget')}
        >
          Over-Budget Breakdown
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'unplanned'}
          className={[
            'budget-flags-table__tab',
            tab === 'unplanned' && 'budget-flags-table__tab--active',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('unplanned')}
        >
          Unplanned Expenses
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="budget-flags-table__empty">{emptyMessage}</p>
      ) : (
        <div className="budget-flags-table__scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Item / Subcategory</th>
                <th className="budget-flags-table__num-head">{amountHeader}</th>
              </tr>
            </thead>
            <tbody>
              {/* Already sorted descending by amount — see ReportsService.getBudgetFlags. */}
              {isOverBudget ? (
                <OverBudgetRows rows={data.overBudget} />
              ) : (
                <UnplannedRows rows={data.unplanned} />
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface BudgetFlagsTableProps {
  year: number;
  month: number;
}

export function BudgetFlagsTable({ year, month }: BudgetFlagsTableProps) {
  const { data, isLoading } = useBudgetFlags(year, month);

  // Nothing to say yet (still loading) and nothing to flag at all (handled inside
  // Inner) both render nothing — an empty table is exactly the "unwanted spacing" to
  // avoid.
  if (isLoading || !data) return null;
  return <BudgetFlagsTableInner data={data} />;
}
