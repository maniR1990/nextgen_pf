'use client';

import type { CashflowReportData } from '@/modules/reports/cashflow-report.types';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN');
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  return <span className="cashflow-report__pct">{pct}%</span>;
}

export interface CashflowReportProps {
  data: CashflowReportData;
  onMonthChange: (year: number, month: number) => void;
}

export function CashflowReport({ data, onMonthChange }: CashflowReportProps) {
  const { year, month } = data;

  function goPrev() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function goNext() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  return (
    <div className="cashflow-report">
      <header className="cashflow-report__header">
        <button
          type="button"
          className="cashflow-report__nav"
          aria-label="Previous month"
          onClick={goPrev}
        >
          ‹
        </button>
        <h2 className="cashflow-report__title">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          className="cashflow-report__nav"
          aria-label="Next month"
          onClick={goNext}
        >
          ›
        </button>
      </header>

      {/* ── Income ─────────────────────────────────────────────────────── */}
      <section className="cashflow-report__section" aria-label="Income">
        <h3 className="cashflow-report__section-title">Income</h3>
        <div className="cashflow-report__row">
          <span className="cashflow-report__source">{data.incomeSourceLabel}</span>
          <span className="cashflow-report__amount cashflow-report__amount--income">
            ₹{formatINR(data.totalIncome)}
          </span>
        </div>
      </section>

      {/* ── Savings & Investments ──────────────────────────────────────── */}
      <section className="cashflow-report__section" aria-label="Savings">
        <h3 className="cashflow-report__section-title">
          Savings &amp; Investments <PctBadge pct={data.savingsPct} />
        </h3>
        {data.savingsBreakdown.map((item) => (
          <div key={item.fundGroupId} className="cashflow-report__row">
            <span
              className="cashflow-report__group-dot"
              style={{ background: item.fundGroupColor ?? undefined }}
            />
            <span className="cashflow-report__group-name">{item.fundGroupName}</span>
            <PctBadge pct={item.pct} />
            <span className="cashflow-report__amount">₹{formatINR(item.totalAmount)}</span>
          </div>
        ))}
        {data.savingsBreakdown.length === 0 && (
          <p className="cashflow-report__empty">No tagged transfers this month.</p>
        )}
      </section>

      {/* ── Fund Used (only when withdrawals exist) ────────────────────── */}
      {data.fundUsed.length > 0 && (
        <section className="cashflow-report__section" aria-label="Fund Used">
          <h3 className="cashflow-report__section-title">Fund Used</h3>
          {data.fundUsed.map((item) => (
            <div key={item.fundGroupId} className="cashflow-report__row">
              <span
                className="cashflow-report__group-dot"
                style={{ background: item.fundGroupColor ?? undefined }}
              />
              <span className="cashflow-report__group-name">{item.fundGroupName}</span>
              <span className="cashflow-report__amount cashflow-report__amount--used">
                ₹{formatINR(item.totalAmount)}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ── Expenses ───────────────────────────────────────────────────── */}
      <section className="cashflow-report__section" aria-label="Expenses">
        <h3 className="cashflow-report__section-title">
          Expenses <PctBadge pct={data.expensesPct} />
        </h3>
        <div className="cashflow-report__row">
          <span className="cashflow-report__amount cashflow-report__amount--expense">
            ₹{formatINR(data.expensesTotal)}
          </span>
        </div>
      </section>

      {/* ── Remaining ──────────────────────────────────────────────────── */}
      <section className="cashflow-report__section" aria-label="Remaining">
        <h3 className="cashflow-report__section-title">
          Remaining <PctBadge pct={data.remainingPct} />
        </h3>
        <div className="cashflow-report__row">
          <span className="cashflow-report__amount cashflow-report__amount--remaining">
            ₹{formatINR(data.remaining)}
          </span>
        </div>
      </section>
    </div>
  );
}
