'use client';

import { MonthNavControl } from '@/components/common/MonthNavControl/MonthNavControl';
import { useReportFilters } from '@/hooks/useReportFilters';
import { BarChart2, Download, SlidersHorizontal } from 'lucide-react';
import { Filter } from 'lucide-react';

function ReportFilterBarInner() {
  const { monthLabel, goPrev, goNext } = useReportFilters();

  return (
    <div className="report-filter-bar" role="toolbar" aria-label="Report controls">
      <div className="report-filter-bar__title">
        <BarChart2 size={15} aria-hidden className="report-filter-bar__title-icon" />
        <span className="report-filter-bar__page-name">Budget Report</span>
        <span className="report-filter-bar__sep" aria-hidden>
          ·
        </span>
        <span className="report-filter-bar__view-label">Transaction Timeline</span>
      </div>

      <div className="report-filter-bar__controls">
        <MonthNavControl label={monthLabel} onPrev={goPrev} onNext={goNext} />

        <div className="report-filter-bar__actions">
          <button
            type="button"
            className="report-filter-bar__action-btn"
            aria-label="Filter report"
          >
            <Filter size={13} aria-hidden />
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="report-filter-bar__action-btn"
            aria-label="Export report"
          >
            <Download size={13} aria-hidden />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="report-filter-bar__action-btn report-filter-bar__action-btn--icon"
            aria-label="Report settings"
          >
            <SlidersHorizontal size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportFilterBar() {
  return <ReportFilterBarInner />;
}
