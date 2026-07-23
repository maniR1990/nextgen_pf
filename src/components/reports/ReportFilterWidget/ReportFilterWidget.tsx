'use client';

import { CategoryPicker } from '@/components/common/CategoryPicker';
import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import { useReportFilter } from '@/hooks/useReportFilter';
import { formatINR } from '@/lib/utils/format';
import { useEffect, useMemo, useState } from 'react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'INVESTMENT', label: 'Investment' },
];

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Same rupee total means something different depending on what's selected — a financial
// review reads "actual" and "increase since last month" differently for money going out
// (Expense) vs money coming in (Income/Investment), so both the label and the trend's
// good/bad color need to follow the selected type instead of always meaning "spend."
function actualLabel(type: string): string {
  if (type === 'EXPENSE') return 'Actual spend';
  if (type === 'INCOME') return 'Actual income';
  if (type === 'INVESTMENT') return 'Actual invested';
  return 'Actual';
}

function ratioLabel(type: string): string {
  if (type === 'INVESTMENT') return 'Invested from income';
  if (type === 'INCOME') return 'Share of total income';
  return 'Spent from income';
}

// Plain rupee comparison instead of a percentage — "23% more" asks the reader to do
// math in their head; "₹1,650 more than last month" is the actual answer already.
function trendText(actual: number, previousActual: number): string {
  const diff = actual - previousActual;
  if (diff === 0) return 'Same as last month';
  return `${formatINR(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than last month`;
}

function trendColor(type: string, actual: number, previousActual: number): string | undefined {
  if (actual === previousActual) return undefined;
  const increaseIsGood = type === 'INCOME' || type === 'INVESTMENT';
  const increased = actual > previousActual;
  return increased === increaseIsGood ? 'var(--color-success)' : 'var(--color-error)';
}

function buildMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  options.push({ value: 'all', label: 'All time' });
  return options;
}

const DEFAULT_CATEGORY = 'all';
const DEFAULT_TYPE = 'all';
const DEFAULT_ACCOUNT = 'all';

export function ReportFilterWidget() {
  const { categories, sources } = useFormOptions();
  const monthOptions = useMemo(buildMonthOptions, []);
  const defaultMonth = monthOptions[0]!.value;

  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [accountId, setAccountId] = useState(DEFAULT_ACCOUNT);
  const [month, setMonth] = useState(defaultMonth);

  const isDirty =
    categoryId !== DEFAULT_CATEGORY ||
    type !== DEFAULT_TYPE ||
    accountId !== DEFAULT_ACCOUNT ||
    month !== defaultMonth;

  const [year, monthNum] =
    month === 'all' ? [undefined, undefined] : month.split('-').map(Number);

  const { data, isFetching, refetch, isFetched } = useReportFilter({
    categoryId: categoryId === 'all' ? undefined : categoryId,
    type: type === 'all' ? undefined : type,
    accountId: accountId === 'all' ? undefined : accountId,
    year,
    month: monthNum,
  });

  // Auto-run once on mount with the sensible defaults (this month, everything) so the
  // widget never opens on a dead blank screen — subsequent runs are explicit "Check total"
  // clicks only, since re-fetching live on every dropdown change reads as untrustworthy
  // for a money figure the user is still composing filters for.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only
  useEffect(() => {
    refetch();
  }, []);

  function handleReset() {
    setCategoryId(DEFAULT_CATEGORY);
    setType(DEFAULT_TYPE);
    setAccountId(DEFAULT_ACCOUNT);
    setMonth(defaultMonth);
    // Re-check immediately with the restored defaults — a reset that leaves stale
    // results on screen from the filters you just cleared isn't actually a reset.
    setTimeout(() => refetch(), 0);
  }

  const noMatches = isFetched && data && data.count === 0;
  const varianceColor =
    data?.variance == null
      ? undefined
      : data.variance > 0
        ? 'var(--color-error)'
        : data.variance < 0
          ? 'var(--color-success)'
          : undefined;

  return (
    <section className="report-filter-widget" aria-label="Filter transactions">
      <div className="report-filter-widget__row">
        <div className="report-filter-widget__field report-filter-widget__field--category">
          <CategoryPicker
            label="Category"
            options={categories}
            value={categoryId === 'all' ? null : categoryId}
            onChange={(id) => setCategoryId(id ?? 'all')}
            placeholder="All categories"
          />
        </div>

        <select
          className="input-field__control report-filter-widget__field"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Transaction type"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="input-field__control report-filter-widget__field"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          aria-label="Account"
        >
          <option value="all">All accounts</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="input-field__control report-filter-widget__field"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--primary btn--sm report-filter-widget__action-btn"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Checking…' : 'Check total'}
        </button>

        <button
          type="button"
          className="btn btn--secondary btn--sm report-filter-widget__action-btn"
          onClick={handleReset}
          disabled={!isDirty && !isFetching}
        >
          Reset
        </button>
      </div>

      {noMatches ? (
        <p className="report-filter-widget__empty">No transactions match these filters.</p>
      ) : (
        data && (
          <div className="report-filter-widget__result">
            <div className="report-filter-widget__metrics">
              <div className="report-filter-widget__metric">
                <span className="report-filter-widget__metric-label">Planned</span>
                <span className="report-filter-widget__metric-value">
                  {data.planned === null ? 'N/A' : formatINR(data.planned)}
                </span>
              </div>
              <div className="report-filter-widget__metric">
                <span className="report-filter-widget__metric-label">{actualLabel(type)}</span>
                <span className="report-filter-widget__metric-value">
                  {formatINR(data.actual)}
                </span>
                {data.previousActual !== null && (
                  <span
                    className="report-filter-widget__metric-sub"
                    style={{ color: trendColor(type, data.actual, data.previousActual) }}
                  >
                    {trendText(data.actual, data.previousActual)}
                  </span>
                )}
              </div>
              <div className="report-filter-widget__metric">
                <span className="report-filter-widget__metric-label">Variance</span>
                <span
                  className="report-filter-widget__metric-value"
                  style={varianceColor ? { color: varianceColor } : undefined}
                >
                  {data.variance === null
                    ? 'N/A'
                    : `${data.variance >= 0 ? '+' : ''}${formatINR(data.variance)}`}
                </span>
              </div>
              {data.incomeForPeriod !== null && (
                <div className="report-filter-widget__metric">
                  <span className="report-filter-widget__metric-label">{ratioLabel(type)}</span>
                  <span className="report-filter-widget__metric-value">
                    {formatINR(data.actual)} / {formatINR(data.incomeForPeriod)}
                  </span>
                </div>
              )}
            </div>
            <p className="report-filter-widget__caption">
              {data.count} matching item{data.count === 1 ? '' : 's'}
              {data.recurringActual > 0 && ` · ${formatINR(data.recurringActual)} recurring`}
            </p>
          </div>
        )
      )}
    </section>
  );
}
