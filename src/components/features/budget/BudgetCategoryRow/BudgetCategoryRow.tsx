'use client';

import { DayOfMonthPicker } from '@/components/common/DayOfMonthPicker';
import { FrequencyPicker } from '@/components/common/FrequencyPicker';
import { CATEGORY_MAX_LEVEL } from '@/constants/categories';
import {
  dueAmountFromMonthly,
  MONTH_LABELS_SHORT,
  monthlyEquivalent,
} from '@/lib/utils/recurringFrequency';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
import type { RecurringFrequency } from '@prisma/client';
import {
  CalendarClock,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PaceContext } from '../BudgetView/BudgetView';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function formatINR(n: number): string {
  if (Math.abs(n) >= 1_00_000) return `₹${(Math.abs(n) / 1_00_000).toFixed(1)}L`;
  return `₹${Math.abs(n).toLocaleString('en-IN')}`;
}

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: 'Monthly',
  TWICE_MONTHLY: 'Twice monthly',
  EVERY_2_MONTHS: 'Every 2 months',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-yearly',
  ANNUAL: 'Annual',
};

function formatMonths(months: number[]): string {
  return months.map((m) => MONTH_LABELS_SHORT[m - 1]).join(', ');
}

function frequencyDetail(frequency: RecurringFrequency | null | undefined, months: number[]): string {
  if (!frequency) return 'Recurring';
  const label = FREQUENCY_LABELS[frequency];
  if (frequency === 'MONTHLY' || months.length === 0) return label;
  return `${label} (${formatMonths(months)})`;
}

// #4 keyboard nav: after committing a planned value, click the next editable planned cell
function focusNextPlannedCell(currentId: string) {
  setTimeout(() => {
    const all = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.budget-row--leaf .budget-row__planned-cell--editable',
      ),
    );
    const idx = all.findIndex((el) => el.dataset.plannedId === currentId);
    if (idx >= 0 && idx < all.length - 1) all[idx + 1].click();
  }, 60);
}

type PaceStatus = 'good' | 'warn' | 'over' | 'past';

function computePace(
  actual: number,
  planned: number,
  ctx: PaceContext,
  isIncome: boolean,
): { status: PaceStatus; label: string; tooltip?: string } | null {
  // No planned budget = no reference to pace against; show nothing.
  if (planned === 0 || actual === 0 || ctx.isFuture || ctx.daysElapsed === 0) return null;
  if (ctx.isPast || ctx.daysElapsed === ctx.daysInMonth)
    return { status: 'past', label: 'Month done' };

  const dailyRate = Math.round(actual / ctx.daysElapsed);
  const pace = Math.round(dailyRate * ctx.daysInMonth);
  // "≈" marks this as a projection, not a real total — the bare rupee figure otherwise
  // reads exactly like Planned/Actual/Remaining, which are all real amounts already spent
  // or committed. The tooltip spells out the math behind it on demand.
  const label = `≈${formatINR(pace)}`;
  const tooltip = `Spending ${formatINR(dailyRate)}/day → projected ${formatINR(pace)} by day ${ctx.daysInMonth}`;

  const ratio = pace / planned;
  if (isIncome) {
    if (ratio >= 1) return { status: 'good', label: 'On track' };
    if (ratio >= 0.8) return { status: 'warn', label, tooltip };
    return { status: 'over', label, tooltip };
  }
  if (ratio <= 1) return { status: 'good', label: 'On track' };
  if (ratio <= 1.1) return { status: 'warn', label, tooltip };
  return { status: 'over', label, tooltip };
}

// #6 Investment semantics: remaining = "gap to goal" (positive = still to invest)
// #7 Income actual: no amber warning when there's no plan
function remClass(remaining: number, planned: number, groupType: string): string {
  if (planned === 0) return '--muted';
  if (groupType === 'INCOME') return remaining <= 0 ? '--good' : '--warn';
  // For investments: gap to goal — positive remaining means you haven't reached target yet (neutral/amber)
  if (groupType === 'INVESTMENT') {
    if (remaining <= 0) return '--good'; // goal met or exceeded
    if (remaining > 0) return '--invest'; // still need to invest (amber)
    return '--muted';
  }
  // Expenses: standard traffic-light
  if (remaining < 0) return '--over';
  if (remaining < 200) return '--warn';
  return '--good';
}

function actualClass(
  progressPct: number,
  hasActual: boolean,
  planned: number,
  groupType: string,
): string {
  if (!hasActual) return '--actual-muted';
  // #7 Income with no plan: just show the number neutrally, don't flash amber
  if (planned === 0 && (groupType === 'INCOME' || groupType === 'INVESTMENT')) return '--actual-ok';
  if (progressPct > 100) return '--actual-over';
  if (progressPct >= 90) return '--actual-near';
  return '--actual-ok';
}

// ── Add-subcategory inline form ───────────────────────────────────────────────

interface AddSubProps {
  isSaving: boolean;
  onSave: (
    name: string,
    planned: number,
    isRecurring: boolean,
    isUnplanned: boolean,
  ) => Promise<void>;
  onCancel: () => void;
}

function AddSubRow({ isSaving, onSave, onCancel }: AddSubProps) {
  const [name, setName] = useState('');
  const [planned, setPlanned] = useState('');
  const [isRecurring, setRec] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function save() {
    const t = name.trim();
    if (!t || isSaving) return;
    await onSave(t, Number(planned) || 0, isRecurring, false);
  }

  return (
    <div className="budget-row budget-row--add">
      {/* Col 1 */}
      <div className="budget-row__name-cell budget-row__name-cell--l2">
        <input
          ref={nameRef}
          className="budget-row__add-name"
          placeholder="Item name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={isSaving}
        />
        <label className="budget-row__add-flag">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setRec(e.target.checked)} />
          <RefreshCw size={11} /> Recurring
        </label>
      </div>
      {/* Col 2 — Planned */}
      <div className="budget-row__planned-cell" style={{ cursor: 'default' }}>
        <span className="budget-row__currency">₹</span>
        <input
          className="budget-row__add-amount"
          type="number"
          min="0"
          placeholder="0"
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={isSaving}
        />
      </div>
      {/* Col 3 */}
      <div
        className="budget-row__actual-cell"
        style={{ color: 'var(--color-text-muted)', textAlign: 'right', paddingRight: 18 }}
      >
        —
      </div>
      {/* Col 4 */}
      <div className="budget-row__remaining-cell" style={{ color: 'var(--color-text-muted)' }}>
        —
      </div>
      {/* Col 5 */}
      <div className="budget-row__pace-cell" />
      {/* Col 6 */}
      <div className="budget-row__lastmo-cell" />
      {/* Col 7 */}
      <div className="budget-row__actions-cell">
        <button
          type="button"
          className="budget-row__action-btn budget-row__action-btn--save"
          onClick={() => void save()}
          disabled={isSaving || !name.trim()}
        >
          {isSaving ? '…' : <Check size={13} />} {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="budget-row__action-btn budget-row__action-btn--cancel"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── BudgetCategoryRow ─────────────────────────────────────────────────────────

interface Props {
  node: BudgetCategoryNode;
  groupType: string;
  depth: number;
  paceCtx: PaceContext;
  pendingCategoryId?: string;
  isAddingChild?: boolean;
  onUpdate: (
    id: string,
    data: {
      planned?: number;
      isRecurring?: boolean;
      frequency?: RecurringFrequency | null;
      months?: number[];
      isUnplanned?: boolean;
      dueDay?: number | null;
    },
  ) => Promise<unknown>;
  onAddChild?: (
    parentId: string,
    name: string,
    planned: number,
    isRecurring: boolean,
    isUnplanned: boolean,
  ) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function BudgetCategoryRow({
  node,
  groupType,
  depth,
  paceCtx,
  pendingCategoryId,
  isAddingChild,
  onUpdate,
  onAddChild,
  onRename,
  onDelete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlanned, setEditP] = useState(false);
  const [draftPlanned, setDraftP] = useState('');
  const [editingDue, setEditDue] = useState(false);
  const [draftDue, setDraftDue] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dueInputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const isSaving = pendingCategoryId === node.id;
  const isRenaming = renamingId === node.id;
  const isIncome = groupType === 'INCOME';
  const hasChildren = node.children.length > 0;
  const hasActual = node.actual > 0;
  const hasLastMo = node.lastMonthActual > 0;

  const remaining = node.planned - node.actual;
  const remMod = remClass(remaining, node.planned, groupType);
  const actMod = actualClass(node.progressPct, hasActual, node.planned, groupType);
  const paceBadge = computePace(node.actual, node.planned, paceCtx, isIncome);

  const delta = node.actual - node.lastMonthActual;
  const deltaGood = isIncome ? delta >= 0 : delta <= 0;

  useEffect(() => {
    if (isRenaming) setTimeout(() => renameRef.current?.select(), 20);
  }, [isRenaming]);

  function startEdit() {
    setDraftP(node.planned > 0 ? String(node.planned) : '');
    setEditP(true);
    setTimeout(() => inputRef.current?.select(), 30);
  }

  async function commitEdit(moveNext = false) {
    setEditP(false);
    const trimmed = draftPlanned.trim();
    // Empty input on blur/Escape should not silently zero out an existing budget.
    if (trimmed !== '') {
      const v = Number(trimmed);
      if (!Number.isNaN(v) && v >= 0 && v !== node.planned) await onUpdate(node.id, { planned: v });
    }
    // #4 Keyboard Tab: move to next editable planned cell
    if (moveNext) focusNextPlannedCell(node.id);
  }

  async function handleFrequencyChange(frequency: RecurringFrequency | null, months: number[]) {
    if (!frequency) {
      await onUpdate(node.id, { isRecurring: false, frequency: null, months: [] });
      return;
    }
    await onUpdate(node.id, { isRecurring: true, frequency, months });
  }

  function startEditDue() {
    const due =
      node.frequency && node.frequency !== 'MONTHLY'
        ? dueAmountFromMonthly(node.planned, node.frequency as RecurringFrequency)
        : node.planned;
    setDraftDue(due > 0 ? String(Math.round(due)) : '');
    setEditDue(true);
    setTimeout(() => dueInputRef.current?.select(), 30);
  }

  async function commitDue() {
    setEditDue(false);
    const trimmed = draftDue.trim();
    if (trimmed !== '' && node.frequency && node.frequency !== 'MONTHLY') {
      const v = Number(trimmed);
      if (!Number.isNaN(v) && v >= 0) {
        const monthly = Math.round(monthlyEquivalent(v, node.frequency as RecurringFrequency));
        if (monthly !== node.planned) await onUpdate(node.id, { planned: monthly });
      }
    }
  }

  async function commitRename() {
    setRenamingId(null);
    const t = draftName.trim();
    if (t && t !== node.name) await onRename(node.id, t);
  }

  async function handleDelete() {
    const subject = hasChildren ? `"${node.name}" and all its sub-items` : `"${node.name}"`;
    const msg = `Remove ${subject}? If there's existing budget or transaction history, it'll be archived instead — hidden from new activity, with all past data kept exactly as-is. Otherwise it's removed for good.`;
    if (!window.confirm(msg)) return;
    await onDelete(node.id);
  }

  // Parent rows roll up children — they are computed, not user-editable.
  // Leaf rows are directly entered by the user.
  const isParent = hasChildren;

  return (
    <>
      <div
        className={[
          'budget-row',
          `budget-row--depth-${depth}`,
          isParent ? 'budget-row--parent' : 'budget-row--leaf',
          isSaving ? 'budget-row--saving' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* ── Col 1: Name ── */}
        <div className="budget-row__name-cell">
          {hasChildren ? (
            <button
              type="button"
              className={`budget-row__chevron${isExpanded ? ' budget-row__chevron--open' : ''}`}
              onClick={() => setIsExpanded((v) => !v)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={14} />
            </button>
          ) : (
            <span className="budget-row__leaf-indent" />
          )}
          {node.color && <span className="budget-row__dot" style={{ background: node.color }} />}
          {node.icon && <span className="budget-row__icon">{node.icon}</span>}

          {isRenaming ? (
            <input
              ref={renameRef}
              className="budget-row__rename-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitRename();
                if (e.key === 'Escape') setRenamingId(null);
              }}
            />
          ) : (
            <span
              className={`budget-row__name${node.isVirtual ? ' budget-row__name--virtual' : ''}`}
              onDoubleClick={
                node.level === 0 || node.isVirtual
                  ? undefined
                  : () => {
                      setDraftName(node.name);
                      setRenamingId(node.id);
                    }
              }
            >
              {node.name}
            </span>
          )}

          {node.isRecurring && (
            <span
              className="budget-row__badge budget-row__badge--rec"
              title={frequencyDetail(node.frequency as RecurringFrequency | null, node.months)}
            >
              ↻
            </span>
          )}
          {node.isUnplanned && (
            <span className="budget-row__badge budget-row__badge--unplanned" title="Unplanned">
              ⚡
            </span>
          )}
          {/* Desktop shows due date via the hover-reveal action icon (below); that action
              row is hidden on mobile to keep leaf rows compact, so mobile gets its own
              always-visible, always-tappable trigger here instead — otherwise there'd be
              no way to set a due date from a phone at all. */}
          {!isParent && node.level > 0 && !node.isVirtual && (
            <DayOfMonthPicker
              value={node.dueDay}
              onChange={(day) => void onUpdate(node.id, { dueDay: day })}
              monthLabel={new Date().toLocaleString('default', { month: 'long' })}
              trigger={({ ref }) =>
                node.dueDay ? (
                  <button
                    ref={ref}
                    type="button"
                    className="budget-row__badge budget-row__badge--due budget-row__badge--due-mobile"
                    title={`Due on the ${node.dueDay}${ordinal(node.dueDay)} — tap to change`}
                  >
                    <CalendarClock size={9} aria-hidden />
                    {node.dueDay}
                    {ordinal(node.dueDay)}
                  </button>
                ) : (
                  <button
                    ref={ref}
                    type="button"
                    className="budget-row__badge budget-row__badge--due-unset budget-row__badge--due-mobile"
                    title="Set a due date"
                    aria-label="Set a due date"
                  >
                    <CalendarClock size={9} aria-hidden />
                  </button>
                )
              }
            />
          )}
        </div>

        {/* ── Col 2: Planned ──
            Parent = rollup (computed, not editable) — shown in secondary style.
            Leaf   = user-set (editable) — shown in blue.                        */}
        {isParent || node.isVirtual ? (
          /* Rollup (or virtual row): computed sum, not editable */
          <div className="budget-row__planned-cell budget-row__planned-cell--rollup">
            <span className="budget-row__rollup-num">
              {node.planned > 0 ? formatINR(node.planned) : '—'}
            </span>
          </div>
        ) : (
          /* #3 Leaf: always shows edit hint so users know it's editable */
          /* #4 tabIndex + keyboard nav so Tab moves between planned cells */
          <div
            className="budget-row__planned-cell budget-row__planned-cell--editable"
            data-planned-id={node.id}
            tabIndex={editingPlanned ? -1 : 0}
            role="button"
            aria-label={`Edit planned amount for ${node.name}`}
            onClick={!editingPlanned ? startEdit : undefined}
            onKeyDown={
              !editingPlanned
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      startEdit();
                    }
                  }
                : undefined
            }
          >
            {editingPlanned ? (
              <input
                ref={inputRef}
                className="budget-row__inline-input"
                type="number"
                inputMode="numeric"
                min="0"
                value={draftPlanned}
                onChange={(e) => setDraftP(e.target.value)}
                onBlur={() => void commitEdit(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void commitEdit(true);
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    void commitEdit(true);
                  }
                  if (e.key === 'Escape') {
                    setEditP(false);
                  }
                }}
              />
            ) : (
              <span className="budget-row__planned-stack">
                <span className="budget-row__amount budget-row__amount--planned">
                  {node.planned > 0 ? (
                    <>
                      {formatINR(node.planned)}
                      <Pencil
                        size={10}
                        className="budget-row__planned-edit-hint"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    <span className="budget-row__amount--placeholder">+ Set budget</span>
                  )}
                </span>
                {/* Smoothing math, made editable: a quarterly/half-yearly/annual item is
                    naturally thought of by its full due amount ("₹6,000 premium"), not its
                    monthly-equivalent. This lets the user type the due amount directly and
                    auto-computes the smoothed monthly figure that Planned actually stores —
                    instead of forcing them to pre-divide it by hand. */}
                {node.isRecurring && node.frequency && node.frequency !== 'MONTHLY' && (
                  <span
                    className="budget-row__due-amount"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {editingDue ? (
                      <input
                        ref={dueInputRef}
                        className="budget-row__due-input"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={draftDue}
                        onChange={(e) => setDraftDue(e.target.value)}
                        onBlur={() => void commitDue()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void commitDue();
                          }
                          if (e.key === 'Escape') setEditDue(false);
                        }}
                      />
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        className="budget-row__due-amount-text"
                        title="Full amount when due — click to edit; Planned recalculates to the monthly equivalent"
                        onClick={startEditDue}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            startEditDue();
                          }
                        }}
                      >
                        {node.planned > 0
                          ? `≈${formatINR(Math.round(dueAmountFromMonthly(node.planned, node.frequency as RecurringFrequency)))} when due`
                          : '+ Set amount when due'}
                      </span>
                    )}
                  </span>
                )}
                {/* Money already set aside toward this category's linked Fund — separate
                    from Actual so a sinking-fund contribution never reads as if it were
                    spent. */}
                {node.transferred != null && (
                  <span className="budget-row__transferred" title="Transferred toward linked fund">
                    {formatINR(node.transferred)}
                    {node.fundTargetAmount ? ` of ${formatINR(node.fundTargetAmount)}` : ''}
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* ── Col 3: Actual ── */}
        <div className="budget-row__actual-cell">
          <span
            className={`budget-row__amount budget-row__amount${actMod}${isParent ? ' budget-row__amount--rollup' : ''}`}
          >
            {hasActual ? formatINR(node.actual) : '—'}
          </span>
        </div>

        {/* ── Col 4: Remaining ── */}
        <div className="budget-row__remaining-cell">
          {node.planned > 0 ? (
            <>
              <span
                className={`budget-row__rem budget-row__rem--desktop budget-row__rem${remMod}${isParent ? ' budget-row__rem--rollup' : ''}`}
              >
                {remaining >= 0 ? formatINR(remaining) : `−${formatINR(Math.abs(remaining))}`}
              </span>
              {/* Mobile-only compact line for mid-tier rollups: one signal, pace overrides remaining
                  when pace is trending worse (a leading indicator beats a lagging one). */}
              {isParent && (
                <span
                  className={`budget-row__rem budget-row__rem--mobile budget-row__rem${
                    paceBadge && (paceBadge.status === 'warn' || paceBadge.status === 'over')
                      ? `--${paceBadge.status}`
                      : remMod
                  }`}
                >
                  {remaining >= 0 ? `${formatINR(remaining)} left` : `${formatINR(Math.abs(remaining))} over`}
                  {paceBadge && (paceBadge.status === 'warn' || paceBadge.status === 'over') && (
                    <span className="budget-row__rem-pace-suffix"> · pace {paceBadge.status}</span>
                  )}
                </span>
              )}
            </>
          ) : (
            <span className="budget-row__rem budget-row__rem--muted">—</span>
          )}
        </div>

        {/* ── Col 5: Pace ── */}
        <div className="budget-row__pace-cell">
          {paceBadge ? (
            <span
              className={`budget-row__pace budget-row__pace--${paceBadge.status}`}
              title={paceBadge.tooltip}
            >
              {paceBadge.label}
            </span>
          ) : (
            <span className="budget-row__amount budget-row__amount--actual-muted">—</span>
          )}
        </div>

        {/* ── Col 6: Last month ── */}
        <div className="budget-row__lastmo-cell">
          {hasLastMo ? (
            <>
              <span className="budget-row__lastmo-amount">{formatINR(node.lastMonthActual)}</span>
              {hasActual && Math.abs(delta) > 0 && (
                <span
                  className={`budget-row__lastmo-delta budget-row__lastmo-delta--${deltaGood ? 'good' : 'bad'}`}
                >
                  {delta >= 0 ? '▲' : '▼'}
                  {formatINR(Math.abs(delta))}
                </span>
              )}
            </>
          ) : (
            <span className="budget-row__amount budget-row__amount--actual-muted">—</span>
          )}
        </div>

        {/* ── Col 7: Action icons (reveal on hover) ──
            Uncategorized is a computed rollup with no real Category id behind it — none
            of these actions have anywhere real to write to, so the whole cell is skipped
            rather than gating each button individually. */}
        <div className="budget-row__actions-cell">
          {!node.isVirtual && (
            <div className="budget-row__actions-inner">
              <FrequencyPicker
                value={node.isRecurring ? ((node.frequency as RecurringFrequency) ?? 'MONTHLY') : null}
                months={node.months}
                onChange={(freq, months) => void handleFrequencyChange(freq, months)}
                trigger={({ open, ref }) => (
                  <button
                    ref={ref}
                    type="button"
                    className={[
                      'freq-picker-trigger',
                      node.isRecurring ? 'freq-picker-trigger--active' : '',
                      open ? 'freq-picker-trigger--open' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={
                      node.isRecurring && node.frequency
                        ? `Recurring — ${frequencyDetail(node.frequency as RecurringFrequency, node.months)}`
                        : 'Mark as recurring'
                    }
                    aria-label={`Recurring frequency for ${node.name}`}
                    disabled={isSaving}
                  >
                    <RefreshCw size={10} />
                    {node.isRecurring && node.frequency && node.frequency !== 'MONTHLY'
                      ? FREQUENCY_LABELS[node.frequency as RecurringFrequency]
                      : null}
                  </button>
                )}
              />
              <button
                type="button"
                className={`budget-row__icon-btn budget-row__icon-btn--unpl${node.isUnplanned ? ' budget-row__icon-btn--active-unpl' : ''}`}
                title={node.isUnplanned ? 'Unplanned ON — click to turn off' : 'Mark as unplanned'}
                onClick={() => void onUpdate(node.id, { isUnplanned: !node.isUnplanned })}
                disabled={isSaving}
              >
                <Zap size={11} />
              </button>
              {node.level > 0 && (
                <button
                  type="button"
                  className="budget-row__icon-btn budget-row__icon-btn--rename"
                  title="Rename (or double-click name)"
                  onClick={() => {
                    setDraftName(node.name);
                    setRenamingId(node.id);
                  }}
                >
                  <Pencil size={11} />
                </button>
              )}
              {onAddChild && depth < CATEGORY_MAX_LEVEL && (
                <button
                  type="button"
                  className="budget-row__icon-btn budget-row__icon-btn--add"
                  title="Add sub-item"
                  onClick={() => {
                    setShowAdd((v) => !v);
                    setIsExpanded(true);
                  }}
                >
                  <Plus size={12} />
                </button>
              )}
              {node.level > 0 && !isParent && (
                <DayOfMonthPicker
                  value={node.dueDay}
                  onChange={(day) => void onUpdate(node.id, { dueDay: day })}
                  monthLabel={new Date().toLocaleString('default', { month: 'long' })}
                  trigger={({ open, ref }) => (
                    <button
                      ref={ref}
                      type="button"
                      className={[
                        'budget-row__icon-btn budget-row__icon-btn--due',
                        node.dueDay ? 'budget-row__icon-btn--active-due' : '',
                        open ? 'budget-row__icon-btn--active-due' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      title={
                        node.dueDay
                          ? `Due on the ${node.dueDay}${ordinal(node.dueDay)} — click to change`
                          : 'Set due date'
                      }
                      disabled={isSaving}
                    >
                      <CalendarClock size={11} />
                    </button>
                  )}
                />
              )}
              {node.level > 0 && (
                <button
                  type="button"
                  className="budget-row__icon-btn budget-row__icon-btn--delete"
                  title="Delete"
                  onClick={() => void handleDelete()}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile-only sub-line: leaf rows with recorded spend only. Collapsed by default to
            one clean signal — "remaining" (matches the parent-rollup treatment) — with the
            spent amount, percentage, and progress bar tucked behind a tap so the list doesn't
            read as three stacked stats per row. */}
        {!isParent && hasActual && (
          <button
            type="button"
            className="budget-row__mobile-stats-toggle"
            onClick={() => setStatsOpen((v) => !v)}
            aria-expanded={statsOpen}
            aria-label={statsOpen ? 'Hide spend details' : 'Show spend details'}
          >
            <span
              className={`budget-row__ms-rem budget-row__ms-rem${node.planned > 0 ? remMod : '--muted'}`}
            >
              {node.planned > 0
                ? remaining >= 0
                  ? `${formatINR(remaining)} left`
                  : `${formatINR(Math.abs(remaining))} over`
                : `spent ${formatINR(node.actual)}`}
            </span>
            <ChevronRight
              size={12}
              className={`budget-row__ms-caret${statsOpen ? ' budget-row__ms-caret--open' : ''}`}
            />
          </button>
        )}

        {!isParent && hasActual && statsOpen && (
          <div className="budget-row__mobile-stats">
            <span className="budget-row__ms-detail">
              <span className="budget-row__ms-spent">spent {formatINR(node.actual)}</span>
            </span>
            {node.planned > 0 && (
              <span className="budget-row__ms-pct">
                {Math.round(node.progressPct)}%
              </span>
            )}
          </div>
        )}

        {/* Mobile-only: thin progress bar — leaf rows with recorded spend only, shown once expanded */}
        {!isParent && hasActual && node.planned > 0 && statsOpen && (
          <div
            className="budget-row__mobile-progress"
            style={{
              '--bar-pct': `${Math.min(node.progressPct, 100)}%`,
              '--bar-color': node.progressPct > 100
                ? '#dc2626'
                : node.progressPct >= 90
                  ? '#d97706'
                  : isIncome ? '#16a34a' : '#16a34a',
            } as React.CSSProperties}
          />
        )}
      </div>

      {/* Children */}
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <BudgetCategoryRow
            key={child.id}
            node={child}
            groupType={groupType}
            depth={depth + 1}
            paceCtx={paceCtx}
            pendingCategoryId={pendingCategoryId}
            onUpdate={onUpdate}
            onAddChild={depth < CATEGORY_MAX_LEVEL - 1 ? onAddChild : undefined}
            onRename={onRename}
            onDelete={onDelete}
            isAddingChild={isAddingChild}
          />
        ))}

      {/* Inline add form */}
      {isExpanded && showAdd && onAddChild && (
        <AddSubRow
          isSaving={isAddingChild ?? false}
          onSave={async (name, planned, isRec, isUnpl) => {
            await onAddChild(node.id, name, planned, isRec, isUnpl);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
