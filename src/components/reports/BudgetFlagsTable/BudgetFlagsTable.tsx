'use client';

import type { BudgetFlagCategory, BudgetFlagsResult, OverBudgetCategory } from '@/hooks/useBudgetFlags';
import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { formatINR } from '@/lib/utils/format';
import { useState } from 'react';

type Tab = 'over-budget' | 'unplanned';

interface Row {
  id: string;
  category: string;
  item: string;
  amount: number;
}

function categoryCell(c: BudgetFlagCategory): string {
  return c.parentName ?? c.name;
}

function itemCell(c: BudgetFlagCategory): string {
  return c.parentName ? c.name : '—';
}

function toRows(items: BudgetFlagCategory[] | OverBudgetCategory[], isOverBudget: boolean): Row[] {
  return items.map((c) => ({
    id: c.id,
    category: categoryCell(c),
    item: itemCell(c),
    amount: isOverBudget ? (c as OverBudgetCategory).over : c.amount,
  }));
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
  // Already sorted descending by amount — see ReportsService.getBudgetFlags.
  const rows = toRows(isOverBudget ? data.overBudget : data.unplanned, isOverBudget);
  const amountHeader = isOverBudget ? 'Excess Amount' : 'Amount';
  const amountClassName = isOverBudget ? 'budget-flags-table__excess' : 'budget-flags-table__amount';
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
        <>
          {/* Desktop / tablet: a real table — plenty of width for 3 columns. */}
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
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.category}</td>
                    <td>{r.item}</td>
                    <td className={amountClassName}>{formatINR(r.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards instead of a horizontally-scrolling table — a 3-column
              money table doesn't compress into a phone width without either truncating a
              column or asking for a sideways swipe most people never discover. Same rows,
              same sort order, just laid out top-to-bottom instead of left-to-right. */}
          <ul className="budget-flags-table__mobile-cards">
            {rows.map((r) => (
              <li key={r.id} className="budget-flags-table__card">
                <div className="budget-flags-table__card-top">
                  <span className="budget-flags-table__card-category">{r.category}</span>
                  <span className={amountClassName}>{formatINR(r.amount, 2)}</span>
                </div>
                <span className="budget-flags-table__card-item">{r.item}</span>
              </li>
            ))}
          </ul>
        </>
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
