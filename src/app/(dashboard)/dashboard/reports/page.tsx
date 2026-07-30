'use client';

import { BudgetFlagsTable } from '@/components/reports/BudgetFlagsTable';
import { BudgetHealthGrid } from '@/components/reports/BudgetHealthGrid';
import { BudgetReportFilterBar } from '@/components/reports/BudgetReportFilterBar';
import { ReportKpiBar } from '@/components/reports/ReportKpiBar';
import { useReportFilters } from '@/hooks/useReportFilters';

export default function ReportsPage() {
  const { filters, setFilters, monthLabel, goPrev, goNext, reset } = useReportFilters();

  return (
    <div className="tx-page__content budget-report">
      <h1 className="budget-report__title">Budget Report</h1>

      <BudgetReportFilterBar
        filters={filters}
        monthLabel={monthLabel}
        onPrev={goPrev}
        onNext={goNext}
        onFilterChange={setFilters}
        onReset={reset}
      />

      <ReportKpiBar year={filters.year} month={filters.month} />

      <BudgetHealthGrid
        year={filters.year}
        month={filters.month}
        type={filters.type}
        accountId={filters.accountId}
        categoryIds={filters.categoryIds}
      />

      <BudgetFlagsTable year={filters.year} month={filters.month} />
    </div>
  );
}
