'use client';

import type { BudgetFlagCategory, BudgetFlagsResult, OverBudgetCategory } from '@/hooks/useBudgetFlags';
import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { formatINR } from '@/lib/utils/format';
import { Search } from 'lucide-react';
import { useState } from 'react';

type Tab = 'over-budget' | 'unplanned';
type SortOrder = 'amount-desc' | 'amount-asc' | 'category-asc' | 'category-desc';

const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'amount-desc', label: 'Amount: High to Low' },
  { value: 'amount-asc', label: 'Amount: Low to High' },
  { value: 'category-asc', label: 'Category: A–Z' },
  { value: 'category-desc', label: 'Category: Z–A' },
];

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

function matchesSearch(row: Row, query: string): boolean {
  if (!query) return true;
  return row.category.toLowerCase().includes(query) || row.item.toLowerCase().includes(query);
}

function sortRows(rows: Row[], sort: SortOrder): Row[] {
  const sorted = [...rows];
  switch (sort) {
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount);
    case 'category-asc':
      return sorted.sort(
        (a, b) => a.category.localeCompare(b.category) || a.item.localeCompare(b.item),
      );
    case 'category-desc':
      return sorted.sort(
        (a, b) => b.category.localeCompare(a.category) || b.item.localeCompare(a.item),
      );
  }
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
  const [search, setSearch] = useState('');
  // Search and sort stay put across a tab switch — a user who's already sorted by
  // category, or is mid-search, almost never wants that reset just for looking at
  // the other list too.
  const [sort, setSort] = useState<SortOrder>('amount-desc');

  if (!hasOverBudget && !hasUnplanned) return null;

  const isOverBudget = tab === 'over-budget';
  const allRows = toRows(isOverBudget ? data.overBudget : data.unplanned, isOverBudget);
  const query = search.trim().toLowerCase();
  const rows = sortRows(
    allRows.filter((r) => matchesSearch(r, query)),
    sort,
  );
  const amountHeader = isOverBudget ? 'Excess Amount' : 'Amount';
  const amountClassName = isOverBudget ? 'budget-flags-table__excess' : 'budget-flags-table__amount';
  const emptyMessage = isOverBudget
    ? 'Nothing is over budget this month.'
    : 'No unplanned spend this month.';

  return (
    <section className="budget-flags-table" aria-label="Budget flags">
      <div className="budget-flags-table__header">
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

        {allRows.length > 0 && (
          <div className="budget-flags-table__controls">
            <div className="budget-flags-table__search">
              <Search size={14} className="budget-flags-table__search-icon" aria-hidden />
              <input
                type="text"
                className="budget-flags-table__search-input"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search category or item"
              />
            </div>
            <select
              className="budget-flags-table__sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              aria-label="Sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {allRows.length === 0 ? (
        <p className="budget-flags-table__empty">{emptyMessage}</p>
      ) : rows.length === 0 ? (
        <p className="budget-flags-table__empty">No matches for "{search.trim()}".</p>
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
