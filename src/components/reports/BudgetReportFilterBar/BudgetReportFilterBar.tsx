'use client';

import { CategoryMultiSelect } from '@/components/common/CategoryMultiSelect';
import { MonthNavControl } from '@/components/common/MonthNavControl/MonthNavControl';
import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import type { ReportFilters } from '@/hooks/useReportFilters';
import { Download } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'INVESTMENT', label: 'Investment' },
];

export interface BudgetReportFilterBarProps {
  filters: ReportFilters;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onFilterChange: (patch: Partial<ReportFilters>) => void;
  onReset: () => void;
}

/**
 * The one and only filter surface for the Budget Report page — date, account,
 * category, and type together, auto-refreshing every section on the page the
 * moment any of them changes (see useReportFilters: every value lives in the URL,
 * so there's nothing to "apply"). Replaces two previously-separate, unsynced
 * controls: a header month-nav bar and a second filter row with its own date
 * dropdown and a manual "Check total" button.
 */
export function BudgetReportFilterBar({
  filters,
  monthLabel,
  onPrev,
  onNext,
  onFilterChange,
  onReset,
}: BudgetReportFilterBarProps) {
  const { sources, reportCategories } = useFormOptions();

  return (
    <div className="budget-report-filters" role="toolbar" aria-label="Budget report filters">
      <MonthNavControl label={monthLabel} onPrev={onPrev} onNext={onNext} />

      <div className="budget-report-filters__group">
        <select
          className="input-field__control budget-report-filters__select"
          value={filters.accountId}
          onChange={(e) => onFilterChange({ accountId: e.target.value })}
          aria-label="Account"
        >
          <option value="all">All accounts</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="budget-report-filters__category">
          <CategoryMultiSelect
            options={reportCategories}
            value={filters.categoryIds}
            onChange={(ids) => onFilterChange({ categoryIds: ids })}
            placeholder="All categories"
            ariaLabel="Category"
          />
        </div>

        <select
          className="input-field__control budget-report-filters__select"
          value={filters.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          aria-label="Transaction type"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="budget-report-filters__actions">
        <button type="button" className="btn btn--secondary btn--sm" onClick={onReset}>
          Reset
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--sm budget-report-filters__export"
          disabled
          title="Export is coming soon"
        >
          <Download size={13} aria-hidden />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
