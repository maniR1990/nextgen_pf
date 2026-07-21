'use client';

import { MonthPicker } from '@/components/common/MonthPicker/MonthPicker';
import { useToast } from '@/components/common/ToastProvider/useToast';
import { PaymentSchedulePanel } from '@/components/common/PaymentSchedulePanel';
import { derivePayments, getStatus } from '@/components/common/PaymentSchedulePanel/derivePayments';
import type { PaymentStatus } from '@/components/common/PaymentSchedulePanel/derivePayments';
import {
  useAddBudgetCategory,
  useBudgetSummary,
  useDeleteCategory,
  useRenameCategory,
  useSeedRecurring,
  useUpdateBudgetPlan,
} from '@/hooks/useBudgetSummary';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BudgetGroupRow } from '../BudgetGroupRow/BudgetGroupRow';

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

export type PaceContext = {
  daysElapsed: number;
  daysInMonth: number;
  isPast: boolean;
  isFuture: boolean;
};

type Filter = 'all' | 'recurring' | 'unplanned';

// ── Column header with hover tooltip ──────────────────────────────────────────

function ColHeader({
  label,
  info,
  example,
  className = '',
}: {
  label: string;
  info: string;
  example: string;
  className?: string;
}) {
  return (
    <span className={`budget-view__th ${className}`}>
      {label}
      <span className="budget-view__col-info" aria-label={`${label}: ${info}. Example: ${example}`}>
        <span className="budget-view__col-info-icon" aria-hidden>
          ⓘ
        </span>
        <span className="budget-view__col-info-tip" role="tooltip">
          <span className="budget-view__col-info-desc">{info}</span>
          <span className="budget-view__col-info-eg">e.g. {example}</span>
        </span>
      </span>
    </span>
  );
}

// ── #1 Month summary bar ───────────────────────────────────────────────────────

function fmt(n: number) {
  if (Math.abs(n) >= 1_00_000) return `₹${(Math.abs(n) / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000) return `₹${Math.abs(n).toLocaleString('en-IN')}`;
  return `₹${Math.abs(n)}`;
}

// Semantic tokens, not literal hex — mirrors PaymentSchedulePanel's STATUS_HEX so both
// stay theme-aware instead of two independently-drifting hardcoded hex maps.
const STATUS_HEX_SUMMARY: Record<PaymentStatus, string> = {
  overdue: 'var(--color-error)',
  soon: 'var(--color-warning)',
  upcoming: 'var(--color-info)',
  paid: 'var(--color-success)',
};

interface PaymentSummaryInfo {
  totalUnpaid: number;
  counts: Record<PaymentStatus, number>;
  itemCount: number;
  worstStatus: PaymentStatus | null;
}

interface SummaryBarProps {
  incomeActual: number;
  incomePlanned: number;
  expActual: number;
  expPlanned: number;
  net: number;
  paceCtx: PaceContext;
  payInfo: PaymentSummaryInfo | null;
  payOpen: boolean;
  onPayToggle: () => void;
}

function SummaryBar({
  incomeActual,
  incomePlanned,
  expActual,
  expPlanned,
  net,
  paceCtx,
  payInfo,
  payOpen,
  onPayToggle,
}: SummaryBarProps) {
  const [masked, setMasked] = useState(true);
  const netPositive = net >= 0;
  const expPct = expPlanned > 0 ? Math.round((expActual / expPlanned) * 100) : null;

  let dayLabel: string | null = null;
  if (paceCtx.isPast) dayLabel = 'Month complete';
  else if (paceCtx.isFuture) dayLabel = 'Upcoming';
  else dayLabel = `Day ${paceCtx.daysElapsed} of ${paceCtx.daysInMonth}`;

  const worstColor = payInfo?.worstStatus ? STATUS_HEX_SUMMARY[payInfo.worstStatus] : 'var(--color-info)';

  return (
    <div className={`budget-summary${payOpen ? ' budget-summary--pay-open' : ''}`}>
      {/* Income */}
      <div className="budget-summary__card">
        <span className="budget-summary__label">Income earned</span>
        <span className="budget-summary__value budget-summary__value--income">
          {masked ? '••••••' : incomeActual > 0 ? fmt(incomeActual) : '₹0'}
        </span>
        {incomePlanned > 0 && !masked && (
          <span className="budget-summary__sub">of {fmt(incomePlanned)} planned</span>
        )}
      </div>

      <span className="budget-summary__divider" />

      {/* Expenses */}
      <div className="budget-summary__card">
        <span className="budget-summary__label">Spent</span>
        <span className="budget-summary__value">{expActual > 0 ? fmt(expActual) : '₹0'}</span>
        {expPlanned > 0 && (
          <span className="budget-summary__sub">
            of {fmt(expPlanned)} planned{expPct !== null ? ` · ${expPct}%` : ''}
          </span>
        )}
      </div>

      <span className="budget-summary__divider" />

      {/* Net */}
      <div className="budget-summary__card budget-summary__card--net">
        <span className="budget-summary__label">
          Net cash flow
          <button
            type="button"
            className="budget-summary__mask-toggle"
            onClick={() => setMasked((v) => !v)}
            aria-label={masked ? 'Show amounts' : 'Hide amounts'}
          >
            {masked ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>
        </span>
        <span
          className={`budget-summary__value budget-summary__value--net${netPositive ? '--pos' : '--neg'}`}
        >
          {masked ? '••••••' : `${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))}`}
        </span>
        {!masked && <span className="budget-summary__sub">income − expenses</span>}
      </div>

      {/* Payments due — 4th card, click to expand dropdown */}
      {payInfo && payInfo.itemCount > 0 && (
        <>
          <span className="budget-summary__divider" />
          <button
            type="button"
            className={`budget-summary__card budget-summary__card--pay${payOpen ? ' budget-summary__card--pay-active' : ''}`}
            onClick={onPayToggle}
            aria-expanded={payOpen}
            aria-label="Toggle payment schedule"
          >
            <span className="budget-summary__label">
              Payments due
              <span className="budget-summary__pay-caret">
                {payOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </span>
            </span>
            <span
              className="budget-summary__value budget-summary__value--pay"
              style={{ color: worstColor }}
            >
              {fmt(payInfo.totalUnpaid)}
            </span>
            <span className="budget-summary__sub budget-summary__pay-chips">
              {(['overdue', 'soon', 'upcoming'] as PaymentStatus[])
                .filter((s) => payInfo.counts[s] > 0)
                .map((s) => (
                  <span
                    key={s}
                    className="budget-summary__pay-chip"
                    style={{ color: STATUS_HEX_SUMMARY[s] }}
                  >
                    <span
                      style={{ background: STATUS_HEX_SUMMARY[s] }}
                      className="budget-summary__pay-dot"
                    />
                    {payInfo.counts[s]}&nbsp;
                    {s === 'overdue' ? 'overdue' : s === 'soon' ? 'due soon' : 'upcoming'}
                  </span>
                ))}
            </span>
          </button>
        </>
      )}

      {/* Day context — pushed to right */}
      {dayLabel && (
        <div className="budget-summary__day">
          <span className="budget-summary__day-label">{dayLabel}</span>
          {!paceCtx.isPast && !paceCtx.isFuture && (
            <div className="budget-summary__day-bar">
              <div
                className="budget-summary__day-fill"
                style={{
                  width: `${Math.round((paceCtx.daysElapsed / paceCtx.daysInMonth) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BudgetView ────────────────────────────────────────────────────────────────

export function BudgetView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [allCollapsed, setAllCol] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function outside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [pickerOpen]);

  // Close payment dropdown on outside click
  useEffect(() => {
    if (!payOpen) return;
    function outside(e: MouseEvent) {
      if (summaryRef.current && !summaryRef.current.contains(e.target as Node)) setPayOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [payOpen]);

  const { data, isLoading, isError } = useBudgetSummary(year, month);
  const { mutate: seed, isPending: isSeeding } = useSeedRecurring(year, month);
  const toast = useToast();

  // First-visit nudge: this month has nothing planned anywhere yet. Rather than rely on
  // the user discovering the "Auto-fill recurring" toolbar button on their own, offer it
  // once, up front. "Not now" is remembered per-month so it doesn't nag on a month the
  // user genuinely wants to leave blank.
  const isMonthEmpty = !!data && data.groups.length > 0 && data.groups.every((g) => g.planned === 0);
  const seedPromptKey = `budget:seed-prompt-dismissed:${year}-${month}`;
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    setPromptDismissed(
      typeof window !== 'undefined' && window.localStorage.getItem(seedPromptKey) === '1',
    );
  }, [seedPromptKey]);

  function dismissSeedPrompt() {
    window.localStorage.setItem(seedPromptKey, '1');
    setPromptDismissed(true);
  }

  function handleSeedFromPrompt() {
    seed(undefined, {
      onSuccess: (result) => {
        dismissSeedPrompt();
        toast.success(
          result.seeded > 0
            ? `Copied ${result.seeded} recurring item${result.seeded > 1 ? 's' : ''} from last month`
            : 'No recurring items to copy — starting fresh this month',
        );
      },
    });
  }

  const showSeedPrompt = !isLoading && !isError && isMonthEmpty && !promptDismissed;

  const updatePlan = useUpdateBudgetPlan(year, month);
  const addCategory = useAddBudgetCategory(year, month);
  const renameCategory = useRenameCategory(year, month);
  const deleteCategory = useDeleteCategory(year, month);

  const pendingCategoryId = updatePlan.isPending ? updatePlan.variables?.categoryId : undefined;

  // #2 Pace / day context
  const paceCtx = useMemo((): PaceContext => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (year < curYear || (year === curYear && month < curMonth))
      return { daysElapsed: daysInMonth, daysInMonth, isPast: true, isFuture: false };
    if (year > curYear || (year === curYear && month > curMonth))
      return { daysElapsed: 0, daysInMonth, isPast: false, isFuture: true };
    return { daysElapsed: today.getDate(), daysInMonth, isPast: false, isFuture: false };
  }, [year, month]);

  // #1 Summary totals
  const summary = useMemo(() => {
    const rawGroups = data?.groups ?? [];
    const sum = (type: string, key: 'planned' | 'actual') =>
      rawGroups.filter((g) => g.type === type).reduce((s, g) => s + g[key], 0);
    const incomeActual = sum('INCOME', 'actual');
    const incomePlanned = sum('INCOME', 'planned');
    const expActual = sum('EXPENSE', 'actual');
    const expPlanned = sum('EXPENSE', 'planned');
    const investActual = sum('INVESTMENT', 'actual');
    return {
      incomeActual,
      incomePlanned,
      expActual,
      expPlanned,
      net: incomeActual - expActual - investActual,
    };
  }, [data]);

  // Payment summary for the 4th summary card
  // biome-ignore lint/correctness/useExhaustiveDependencies: now is a stable Date object created at render time; its .getDate() doesn't change during a session
  const payInfo = useMemo((): PaymentSummaryInfo | null => {
    if (!data) return null;
    const todayDay = paceCtx.isFuture ? 0 : now.getDate();
    const items = derivePayments(data.groups);
    if (items.length === 0) return null;
    const counts: Record<PaymentStatus, number> = { overdue: 0, soon: 0, upcoming: 0, paid: 0 };
    let totalUnpaid = 0;
    let worstSeverity = -1;
    let worstStatus: PaymentStatus | null = null;
    const sev: Record<PaymentStatus, number> = { overdue: 3, soon: 2, upcoming: 1, paid: 0 };
    for (const item of items) {
      const s = getStatus(item, todayDay, paceCtx.isFuture);
      counts[s]++;
      if (s !== 'paid') totalUnpaid += item.amount;
      if (sev[s] > worstSeverity) {
        worstSeverity = sev[s];
        worstStatus = s;
      }
    }
    return { totalUnpaid, counts, itemCount: items.length, worstStatus };
  }, [data, paceCtx.isFuture]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const groups = (data?.groups ?? [])
    .map((g) => ({
      ...g,
      categories: g.categories
        .map((cat) => ({
          ...cat,
          children: cat.children.filter((child) => {
            if (filter === 'recurring' && !child.isRecurring) return false;
            if (filter === 'unplanned' && !child.isUnplanned) return false;
            if (search && !child.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
          }),
        }))
        .filter((cat) => {
          const nameMatch =
            !search ||
            cat.name.toLowerCase().includes(search.toLowerCase()) ||
            cat.children.length > 0;
          const flagMatch =
            filter === 'all' ||
            (filter === 'recurring' &&
              (cat.isRecurring || cat.children.some((c) => c.isRecurring))) ||
            (filter === 'unplanned' &&
              (cat.isUnplanned || cat.children.some((c) => c.isUnplanned)));
          return nameMatch && flagMatch;
        }),
    }))
    .filter((g) => g.categories.length > 0);

  return (
    <div className="budget-view">
      {/* ── Toolbar ──
          Two groups so mobile can lay each out independently (they need different column
          widths — "Auto-fill recurring" is wider than "Expand all", so they can't share a
          grid track). display: contents on desktop keeps every child a direct flex item of
          .budget-view__toolbar, i.e. pixel-identical to before this split. */}
      <div className="budget-view__toolbar">
        <div className="budget-view__toolbar-row1">
          <div className="budget-view__chips">
            {(['all', 'recurring', 'unplanned'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`budget-view__chip${filter === f ? ' budget-view__chip--active' : ''}`}
                onClick={() => setFilter(f)}
                aria-label={
                  f === 'all'
                    ? 'Show all categories'
                    : f === 'recurring'
                      ? 'Filter: recurring only'
                      : 'Filter: unplanned only'
                }
              >
                {f === 'all' ? (
                  'All'
                ) : (
                  <>
                    <span aria-hidden="true">{f === 'recurring' ? '↻' : '⚡'}</span>{' '}
                    <span className="budget-view__chip-label">
                      {f === 'recurring' ? 'Recurring' : 'Unplanned'}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Expand / Collapse all — chip in Row 1 on mobile, inline on desktop */}
          <button
            type="button"
            className="budget-view__expand-btn"
            onClick={() => setAllCol((v) => !v)}
            aria-label={allCollapsed ? 'Expand all categories' : 'Collapse all categories'}
          >
            {allCollapsed ? <ChevronsDown size={13} aria-hidden /> : <ChevronsUp size={13} aria-hidden />}
            <span className="budget-view__expand-label">
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </span>
          </button>

          {/* Month nav */}
          <div className="budget-view__month-wrap" ref={pickerRef}>
            <button
              type="button"
              className="budget-view__month-nav-btn"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="budget-view__month-label"
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              aria-haspopup="dialog"
            >
              {monthLabel}
              <span className="budget-view__month-caret" aria-hidden>
                ▾
              </span>
            </button>
            <button
              type="button"
              className="budget-view__month-nav-btn"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
            {pickerOpen && (
              <div className="budget-view__month-dropdown" role="dialog" aria-label="Pick a month">
                <MonthPicker
                  value={{ year, month }}
                  clearable={false}
                  onChange={({ year: y, month: m }) => {
                    setYear(y);
                    setMonth(m);
                    setPickerOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="budget-view__toolbar-row2">
          <div className="budget-view__search">
            <Search size={14} className="budget-view__search-icon" aria-hidden />
            <input
              type="text"
              className="budget-view__search-input"
              placeholder="Find category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="budget-view__actions">
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => seed()}
              disabled={isSeeding}
              title="Copies all recurring planned amounts from the previous month into this month."
            >
              {isSeeding ? (
                '↻ Filling…'
              ) : (
                <>
                  ↻ Auto-fill<span className="budget-view__autofill-suffix"> recurring</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showSeedPrompt && (
        <div className="budget-view__seed-prompt" role="status">
          <div className="budget-view__seed-prompt-text">
            <strong>{monthLabel} hasn't been set up yet.</strong>
            <span>Copy your recurring bills forward, or start this month fresh.</span>
          </div>
          <div className="budget-view__seed-prompt-actions">
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={handleSeedFromPrompt}
              disabled={isSeeding}
            >
              {isSeeding ? 'Copying…' : 'Copy recurring items'}
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={dismissSeedPrompt}>
              Not now
            </button>
          </div>
        </div>
      )}

      {/* ── Summary bar with payments card + expandable dropdown ── */}
      {!isLoading && !isError && data && (
        <div className="budget-view__summary-area" ref={summaryRef}>
          <SummaryBar
            {...summary}
            paceCtx={paceCtx}
            payInfo={payInfo}
            payOpen={payOpen}
            onPayToggle={() => setPayOpen((v) => !v)}
          />
          {payOpen && (
            <div className="budget-view__pay-dropdown">
              <PaymentSchedulePanel
                groups={data.groups}
                monthLabel={monthLabel}
                year={year}
                month={month}
                isFutureMonth={paceCtx.isFuture}
                headless
              />
            </div>
          )}
        </div>
      )}

      {/* ── Table header ── */}
      <div className="budget-view__table-head">
        <span className="budget-view__th">CATEGORY</span>
        <ColHeader
          label="PLANNED"
          className="budget-view__th--num budget-view__th--planned"
          info="Your budget target. Click any leaf row cell to edit it."
          example="Planned ₹5,000 for Groceries"
        />
        <ColHeader
          label="ACTUAL"
          className="budget-view__th--num"
          info="What you've actually spent or earned so far this month."
          example="Spent ₹3,200 on Groceries so far"
        />
        <ColHeader
          label="REMAINING"
          className="budget-view__th--num"
          info="Budget left to spend. Green = safe, red = over budget. For investments: gap to reach your goal."
          example="₹1,800 left · −₹500 if over"
        />
        <ColHeader
          label="PACE"
          className="budget-view__th--pace"
          info="At today's spend rate, will you stay within budget by month-end? Only shown when a budget is set."
          example="Day 10: spent ₹1,600 → on pace for ₹5,000 by day 30"
        />
        <ColHeader
          label="LAST MONTH"
          className="budget-view__th--num budget-view__th--lastmo"
          info="Your actual spend last month, with ▲▼ vs this month so far."
          example="May: ₹4,200 · ▲₈₀₀ vs this month"
        />
        <span className="budget-view__th budget-view__th--actions" />
      </div>

      {/* ── Body ── */}
      <div className="budget-view__body">
        {isLoading && <div className="budget-view__empty">Loading…</div>}
        {isError && (
          <div className="budget-view__empty budget-view__empty--error">Failed to load budget.</div>
        )}
        {!isLoading && !isError && groups.length === 0 && (
          <div className="budget-view__empty">
            {search || filter !== 'all'
              ? 'No categories match your filter.'
              : 'No categories yet. Add them in Settings → Categories.'}
          </div>
        )}
        {groups.map((group) => (
          <BudgetGroupRow
            key={group.id}
            group={group}
            forceCollapsed={allCollapsed}
            paceCtx={paceCtx}
            pendingCategoryId={pendingCategoryId}
            onUpdate={(categoryId, patch) => updatePlan.mutateAsync({ categoryId, data: patch })}
            onAddCategory={(parentId, name, planned, isRecurring, isUnplanned) =>
              addCategory.mutateAsync({ parentId, name, planned, isRecurring, isUnplanned })
            }
            onRename={(id, name) => renameCategory.mutateAsync({ id, name })}
            onDelete={(id) => deleteCategory.mutateAsync({ id })}
            isAddingCategory={addCategory.isPending}
          />
        ))}
      </div>
    </div>
  );
}
