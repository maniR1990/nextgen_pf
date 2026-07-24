'use client';

import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import { useReportFilter } from '@/hooks/useReportFilter';
import { formatINR } from '@/lib/utils/format';
import { useEffect, useMemo, useState } from 'react';
import { CategoryMultiSelect } from './CategoryMultiSelect';

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

const DEFAULT_TYPE = 'all';
const DEFAULT_ACCOUNT = 'all';

export function ReportFilterWidget() {
  const { reportCategories, sources } = useFormOptions();
  const monthOptions = useMemo(buildMonthOptions, []);
  const defaultMonth = monthOptions[0]!.value;
  const defaultParamsKey = `|${DEFAULT_TYPE}|${DEFAULT_ACCOUNT}|${defaultMonth}`;

  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [accountId, setAccountId] = useState(DEFAULT_ACCOUNT);
  const [month, setMonth] = useState(defaultMonth);

  // Sorted so picking two categories in either order still counts as the same filter
  // combo — otherwise toggling them off and back on in a different order would falsely
  // read as "changed" even though nothing about the query actually did.
  const categoryIdsKey = [...categoryIds].sort().join(',');

  // What's actually on screen right now — the filter combo the last "Check total" (or
  // Reset, or the initial auto-check) actually ran with. Diverges from the live filter
  // state the moment the user touches a dropdown, and that divergence is exactly the
  // signal used below to hide the now-unrelated numbers instead of leaving them up
  // looking like they answer a question the user hasn't asked yet.
  const [checkedParamsKey, setCheckedParamsKey] = useState(defaultParamsKey);
  const currentParamsKey = `${categoryIdsKey}|${type}|${accountId}|${month}`;
  const isStale = currentParamsKey !== checkedParamsKey;

  const isDirty =
    categoryIds.length > 0 ||
    type !== DEFAULT_TYPE ||
    accountId !== DEFAULT_ACCOUNT ||
    month !== defaultMonth;

  const [year, monthNum] =
    month === 'all' ? [undefined, undefined] : month.split('-').map(Number);

  const { data, isFetching, refetch, isFetched } = useReportFilter({
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
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

  function handleCheck() {
    setCheckedParamsKey(currentParamsKey);
    refetch();
  }

  function handleReset() {
    setCategoryIds([]);
    setType(DEFAULT_TYPE);
    setAccountId(DEFAULT_ACCOUNT);
    setMonth(defaultMonth);
    // Mark the defaults as "checked" immediately, not after the deferred refetch below
    // resolves — otherwise the result briefly (and wrongly) reads as stale right after
    // a reset, which is the one moment it's guaranteed not to be.
    setCheckedParamsKey(defaultParamsKey);
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
          <CategoryMultiSelect
            options={reportCategories}
            value={categoryIds}
            onChange={setCategoryIds}
            placeholder="All categories"
            ariaLabel="Category"
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
          onClick={handleCheck}
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

      {isStale ? (
        <p className="report-filter-widget__empty">
          Filters changed — press Check total to see updated results.
        </p>
      ) : noMatches ? (
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
