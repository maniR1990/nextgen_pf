'use client';

import { useBudgetFlags } from '@/hooks/useBudgetFlags';
import { useReportFilter } from '@/hooks/useReportFilter';
import type { ReportFilterResult, ReportFilterTypeBreakdown } from '@/hooks/useReportFilter';
import { formatINR } from '@/lib/utils/format';

type FlowType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

const SECTION_LABEL: Record<FlowType, string> = {
  EXPENSE: 'Expenses',
  INVESTMENT: 'Investments',
  INCOME: 'Income',
};

// "Planned" reads differently per type — a spending ceiling (Expenses), a savings goal
// (Investments), an income target (Income) — so each section gets its own vocabulary
// instead of one generic label stretched to cover all three.
const ROW_LABELS: Record<FlowType, { planned: string; actual: string; variance: string }> = {
  EXPENSE: { planned: 'Planned Limit', actual: 'Actual Spent', variance: 'Remaining' },
  INVESTMENT: { planned: 'Goal', actual: 'Actual Invested', variance: 'Shortfall' },
  INCOME: { planned: 'Planned Target', actual: 'Actual Received', variance: 'Variance' },
};

const GENERIC_LABELS = { planned: 'Planned', actual: 'Actual', variance: 'Variance' };

function formatSigned(n: number): string {
  // formatINR already prints its own minus sign for negatives — only the "+" for a
  // non-negative surplus/shortfall needs adding here. Always 2 decimals so every
  // right-aligned row in the grid lines up instead of drifting between whole and
  // fractional rupee amounts.
  return n >= 0 ? `+${formatINR(n, 2)}` : formatINR(n, 2);
}

function varianceColor(type: FlowType | null, value: number): string | undefined {
  if (value === 0) return undefined;
  // Expenses (and an unresolved/mixed selection, which most often means "some expense
  // categories") read less-than-planned as good. Income/Investment read more-than-planned
  // as good.
  const isGood = type === 'INCOME' || type === 'INVESTMENT' ? value > 0 : value < 0;
  return isGood ? 'var(--color-success)' : 'var(--color-error)';
}

interface CardProps {
  heading: string;
  type: FlowType | null;
  planned: number | null;
  actual: number;
  variance: number | null;
  /** Only meaningful (and only ever shown) for the Expenses card — a category flagged
   *  "unplanned" in the Budget page, not something Income/Investment track. */
  unplannedSpend?: number;
  /** Investments card only — the split behind `actual`. Sinking Deposit isn't a
   *  selectable report type on its own (tracked via Funds, not categories), so without
   *  this it would silently be invisible here despite counting toward "Actual Invested". */
  investmentActual?: number;
  sinkingActual?: number;
  /** Expenses/Investments only — see ReportFilterTypeBreakdown.pacePerDay. Null/undefined
   *  (a past/future month, or the Income card) simply omits the row rather than showing
   *  a rate that isn't actually live. */
  pacePerDay?: number | null;
}

function HealthCard({
  heading,
  type,
  planned,
  actual,
  variance,
  unplannedSpend,
  investmentActual,
  sinkingActual,
  pacePerDay,
}: CardProps) {
  const labels = type ? ROW_LABELS[type] : GENERIC_LABELS;
  // Expenses' 3rd row is a plain "how much is left" (planned minus spent) — formatINR's
  // own sign handling is enough. Investment/Income read as an explicit surplus/shortfall
  // against a target, which reads better with an always-visible +/- sign.
  const rowValue = variance === null ? null : type === 'EXPENSE' ? -variance : variance;
  const showAsRemaining = type === 'EXPENSE';

  return (
    <div className="budget-health__card">
      <h3 className="budget-health__card-title">{heading}</h3>
      <div className="budget-health__row">
        <span className="budget-health__label">{labels.planned}</span>
        <span className="budget-health__value">
          {planned === null
            ? 'N/A'
            : planned === 0 && type === 'INCOME'
              ? 'Not set'
              : formatINR(planned, 2)}
        </span>
      </div>
      <div className="budget-health__row">
        <span className="budget-health__label">{labels.actual}</span>
        <span className="budget-health__value">{formatINR(actual, 2)}</span>
      </div>
      {pacePerDay !== null && pacePerDay !== undefined && (
        <div className="budget-health__subrow">
          <span>Pace</span>
          <span className="budget-health__subrow-value">{formatINR(pacePerDay, 0)}/day</span>
        </div>
      )}
      {type === 'INVESTMENT' && investmentActual !== undefined && sinkingActual !== undefined && (
        <>
          <div className="budget-health__subrow">
            <span>Investment</span>
            <span className="budget-health__subrow-value">{formatINR(investmentActual, 2)}</span>
          </div>
          <div className="budget-health__subrow">
            <span>Sinking</span>
            <span className="budget-health__subrow-value">{formatINR(sinkingActual, 2)}</span>
          </div>
        </>
      )}
      {type === 'EXPENSE' && unplannedSpend !== undefined && (
        // Sub-row, not a full row — Unplanned is a breakdown of Actual Spent above (every
        // unplanned rupee is already counted in it), not a 4th step toward Remaining. Full
        // row weight implied "Planned → Actual → Unplanned → Remaining" math that doesn't
        // happen; Remaining is Planned minus Actual only.
        <div className="budget-health__subrow">
          <span>Unplanned</span>
          <span className="budget-health__subrow-value">{formatINR(unplannedSpend, 2)}</span>
        </div>
      )}
      <div className="budget-health__row">
        <span className="budget-health__label">{labels.variance}</span>
        {type === 'INCOME' && planned === 0 ? (
          // A variance against a target that was never set isn't a real signal — it was
          // just restating the full received amount and coloring it green. Once a target
          // exists this falls through to the normal colored variance below as usual.
          <span className="budget-health__value budget-health__value--muted">
            set a target to compare
          </span>
        ) : (
          <span
            className="budget-health__value"
            style={{ color: variance === null ? undefined : varianceColor(type, variance) }}
          >
            {rowValue === null
              ? 'N/A'
              : showAsRemaining
                ? formatINR(rowValue, 2)
                : formatSigned(rowValue)}
          </span>
        )}
      </div>
    </div>
  );
}

function byTypeCard(b: ReportFilterTypeBreakdown, unplannedSpend?: number) {
  return (
    <HealthCard
      key={b.type}
      heading={SECTION_LABEL[b.type]}
      type={b.type}
      planned={b.planned}
      actual={b.actual}
      variance={b.variance}
      unplannedSpend={b.type === 'EXPENSE' ? unplannedSpend : undefined}
      investmentActual={b.investmentActual}
      sinkingActual={b.sinkingActual}
      pacePerDay={b.pacePerDay}
    />
  );
}

export interface BudgetHealthGridInnerProps {
  data: ReportFilterResult;
  /** The type filter currently applied — 'all' unless the user narrowed it, in which
   *  case the single-result card below adopts that type's vocabulary too. */
  selectedType: string;
  /** This month's total unplanned spend (all categories) — a whole-month figure, so it
   *  only appears on the unfiltered 3-card grid. A narrowed single-category/account view
   *  would otherwise show a total that doesn't actually describe what's on screen. */
  unplannedSpend?: number;
}

export function BudgetHealthGridInner({
  data,
  selectedType,
  unplannedSpend,
}: BudgetHealthGridInnerProps) {
  if (data.count === 0) {
    return <p className="budget-health__empty">No transactions match these filters.</p>;
  }

  if (data.byType) {
    return (
      <div className="budget-health__grid">
        {data.byType.map((b) => byTypeCard(b, unplannedSpend))}
      </div>
    );
  }

  // A specific type or category is selected — one card, not three. Only a concrete
  // type (not "all" + a category alone, which could span several types at once) gets
  // that type's specific vocabulary; otherwise the generic Planned/Actual/Variance
  // labels apply, same as the old filter tool's single-result view.
  const type: FlowType | null =
    selectedType === 'EXPENSE' || selectedType === 'INCOME' || selectedType === 'INVESTMENT'
      ? selectedType
      : null;

  return (
    <div className="budget-health__grid budget-health__grid--single">
      <HealthCard
        heading={type ? SECTION_LABEL[type] : 'Selected filters'}
        type={type}
        planned={data.planned}
        actual={data.actual ?? 0}
        variance={data.variance}
        investmentActual={data.investmentActual}
        sinkingActual={data.sinkingActual}
        pacePerDay={data.pacePerDay}
      />
    </div>
  );
}

export interface BudgetHealthGridProps {
  year: number;
  month: number;
  type: string;
  accountId: string;
  categoryIds: string[];
}

export function BudgetHealthGrid({
  year,
  month,
  type,
  accountId,
  categoryIds,
}: BudgetHealthGridProps) {
  const { data, isLoading } = useReportFilter({
    year,
    month,
    type: type === 'all' ? undefined : type,
    accountId: accountId === 'all' ? undefined : accountId,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
  });
  // Same query BudgetFlagsTable makes for this (year, month) — react-query dedupes it,
  // so this isn't a second network request, just a second read of the same cache entry.
  const { data: flagsData } = useBudgetFlags(year, month);

  return (
    <section className="budget-health" aria-label="Budget health">
      <h2 className="budget-health__title">Budget Health Data Grid</h2>
      {isLoading || !data ? (
        <div className="budget-health__grid" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="budget-health__card budget-health__card--loading" />
          ))}
        </div>
      ) : (
        <BudgetHealthGridInner
          data={data}
          selectedType={type}
          unplannedSpend={flagsData?.unplannedTotal}
        />
      )}
    </section>
  );
}
