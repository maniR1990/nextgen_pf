'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { formatKpiMoney } from '@/components/ui/KpiCards';
import { type ReportKpiData, useReportKpiData } from '@/hooks/useReportKpiData';
import { Minus, TrendingUp } from 'lucide-react';

// ─── Inner (pure presentational) ─────────────────────────────────────────────

export interface ReportKpiBarInnerProps {
  data: ReportKpiData;
}

const BALANCE_STATUS_CLASS: Record<'success' | 'warning' | 'error', string> = {
  success: 'report-kpi-strip__status--success',
  warning: 'report-kpi-strip__status--warning',
  error: 'report-kpi-strip__status--error',
};

export function ReportKpiBarInner({ data }: ReportKpiBarInnerProps) {
  const fmt = (minor: number) => formatKpiMoney({ amountMinor: minor, currency: 'INR' });

  return (
    <section className="report-kpi-strip" aria-label="Cash flow overview">
      {/* 1 — TOTAL INCOME */}
      <div className="report-kpi-strip__cell">
        <div className="report-kpi-strip__head">
          <span className="report-kpi-strip__label">Total Income</span>
          <TrendingUp size={14} aria-hidden className="report-kpi-strip__icon report-kpi-strip__icon--success" />
        </div>
        <span className="report-kpi-strip__value report-kpi-strip__value--income">
          {fmt(data.totalIncomeMinor)}
        </span>
        <span className="report-kpi-strip__sub">{data.incomeSourceLabel}</span>
      </div>

      {/* 2 — TOTAL EXPENSES */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Total Expenses</span>
        <span className="report-kpi-strip__value">{fmt(data.expensesSpentMinor)}</span>
        <span className="report-kpi-strip__sub">Burn rate: {data.expensesPct}%</span>
      </div>

      {/* 3 — TOTAL INVESTED */}
      <div className="report-kpi-strip__cell">
        <div className="report-kpi-strip__head">
          <span className="report-kpi-strip__label">Total Invested</span>
          {data.investedMinor === 0 && (
            <Minus size={14} aria-hidden className="report-kpi-strip__icon" />
          )}
        </div>
        <span className="report-kpi-strip__value">{fmt(data.investedMinor)}</span>
        <span className="report-kpi-strip__sub">{data.investedLabel}</span>
      </div>

      {/* 4 — AVAILABLE BALANCE */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Available Balance</span>
        <span className="report-kpi-strip__value">{fmt(data.accountBalanceMinor)}</span>
        <span className={`report-kpi-strip__sub ${BALANCE_STATUS_CLASS[data.balanceVariant]}`}>
          {data.balanceStatus}
        </span>
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ReportKpiBarSkeleton() {
  return (
    <section
      className="report-kpi-strip report-kpi-strip--loading"
      aria-label="Loading cash flow overview"
      aria-busy="true"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="report-kpi-strip__cell">
          <Skeleton variant="text" width="60%" height={10} />
          <Skeleton variant="text" width="80%" height={22} />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
      ))}
    </section>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface ReportKpiBarProps {
  year: number;
  month: number;
}

export function ReportKpiBar({ year, month }: ReportKpiBarProps) {
  const { data, isLoading } = useReportKpiData(year, month);

  if (isLoading || !data) return <ReportKpiBarSkeleton />;
  return <ReportKpiBarInner data={data} />;
}
