'use client';

import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { formatKpiMoney } from '@/components/ui/KpiCards';
import { Skeleton } from '@/components/ui/Skeleton';
import { type ReportKpiData, useReportKpiData } from '@/hooks/useReportKpiData';
import { TrendingUp } from 'lucide-react';

// ─── Inner (pure presentational) ─────────────────────────────────────────────

export interface ReportKpiBarInnerProps {
  data: ReportKpiData;
}

export function ReportKpiBarInner({ data }: ReportKpiBarInnerProps) {
  const fmt = (minor: number) => formatKpiMoney({ amountMinor: minor, currency: 'INR' });

  const EXPENSE_VARIANT_MAP = {
    success: 'success',
    warning: 'warning',
    error: 'error',
  } as const;

  const BALANCE_CHIP_VARIANT = {
    success: 'success',
    warning: 'neutral',
    error: 'neutral',
  } as const;

  return (
    <section className="report-kpi-strip" aria-label="Report summary">
      {/* 1 — TOTAL INCOME */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Total Income</span>
        <span className="report-kpi-strip__value report-kpi-strip__value--income">
          {fmt(data.totalIncomeMinor)}
        </span>
        <div className="report-kpi-strip__sub">
          <TrendingUp size={12} aria-hidden className="report-kpi-strip__trend-icon" />
          <Chip variant="success" action="none">
            {data.incomeSourceLabel}
          </Chip>
        </div>
      </div>

      {/* 2 — EXPENSES SPENT */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Expenses Spent</span>
        <span className="report-kpi-strip__value report-kpi-strip__value--money">
          {fmt(data.expensesSpentMinor)}
        </span>
        <div className="report-kpi-strip__sub">
          <span className="report-kpi-strip__sub-text">of {fmt(data.expensesBudgetMinor)} ·</span>
          <Badge variant={EXPENSE_VARIANT_MAP[data.expensesVariant]}>{data.expensesPct}%</Badge>
        </div>
      </div>

      {/* 3 — INVESTED */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Invested</span>
        <span className="report-kpi-strip__value report-kpi-strip__value--money">
          {fmt(data.investedMinor)}
        </span>
        <div className="report-kpi-strip__sub">
          <Chip variant="brand" action="none">
            {data.investedLabel}
          </Chip>
        </div>
      </div>

      {/* 4 — BUDGET REMAINING */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Budget Remaining</span>
        <span className="report-kpi-strip__value report-kpi-strip__value--money">
          {fmt(data.budgetRemainingMinor)}
        </span>
        <div className="report-kpi-strip__sub">
          <span className="report-kpi-strip__sub-text">
            {data.daysLeft > 0 ? `for ${data.daysLeft} days left` : 'period closed'}
          </span>
        </div>
      </div>

      {/* 5 — ACCOUNT BALANCE */}
      <div className="report-kpi-strip__cell">
        <span className="report-kpi-strip__label">Account Balance</span>
        <span className="report-kpi-strip__value report-kpi-strip__value--money">
          {fmt(data.accountBalanceMinor)}
        </span>
        <div className="report-kpi-strip__sub">
          <Chip variant={BALANCE_CHIP_VARIANT[data.balanceVariant]} action="none">
            {data.balanceStatus}
          </Chip>
        </div>
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ReportKpiBarSkeleton() {
  return (
    <section
      className="report-kpi-strip report-kpi-strip--loading"
      aria-label="Loading report summary"
      aria-busy="true"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="report-kpi-strip__cell">
          <Skeleton variant="text" width="60%" height={10} />
          <Skeleton variant="text" width="80%" height={22} />
          <Skeleton variant="rect" width="50%" height={18} />
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
