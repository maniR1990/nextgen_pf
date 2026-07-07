'use client';

import type { BudgetGroup } from '@/modules/budget-engine/budget-engine.types';
import { Check, ChevronRight, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BudgetCategoryRow } from '../BudgetCategoryRow/BudgetCategoryRow';
import type { PaceContext } from '../BudgetView/BudgetView';

function formatINR(n: number): string {
  if (Math.abs(n) >= 1_00_000) return `₹${(Math.abs(n) / 1_00_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `₹${Math.abs(n).toLocaleString('en-IN')}`;
  return `₹${Math.abs(n)}`;
}

function computeGroupPace(actual: number, planned: number, ctx: PaceContext, isIncome: boolean) {
  // No planned budget = no reference to pace against; show nothing.
  if (planned === 0 || actual === 0 || ctx.isFuture || ctx.daysElapsed === 0) return null;
  if (ctx.isPast) return { status: 'past', label: 'Month done' };

  const dailyRate = Math.round(actual / ctx.daysElapsed);
  const pace = Math.round(dailyRate * ctx.daysInMonth);
  // "≈" marks this as a projection, not a real total — see BudgetCategoryRow's
  // computePace for the full rationale (same pattern, group-level rollup here).
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

const GROUP_LABEL: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expenses',
  INVESTMENT: 'Investments',
  TRANSFER: 'Transfers',
};
const GROUP_COLOR: Record<string, string> = {
  INCOME: 'var(--color-success)',
  EXPENSE: 'var(--color-danger)',
  INVESTMENT: '#6c63ff',
  TRANSFER: 'var(--color-text-muted)',
};

// ── #5 Inline add form — matches the same table grid as every other row ───────

function InlineAddRow({
  isSaving,
  onSave,
  onCancel,
}: {
  isSaving: boolean;
  onSave: (name: string, planned: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [planned, setPlanned] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function save() {
    const t = name.trim();
    if (!t || isSaving) return;
    await onSave(t, Number(planned) || 0);
  }

  return (
    // Uses budget-row grid so columns align perfectly with the table
    <div className="budget-row budget-row--add budget-row--leaf">
      {/* Col 1: name */}
      <div className="budget-row__name-cell" style={{ paddingLeft: 8 }}>
        <input
          ref={nameRef}
          className="budget-group__inline-add-input"
          placeholder="Category name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={isSaving}
        />
      </div>
      {/* Col 2: planned amount */}
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
      {/* Cols 3–6: empty */}
      <div className="budget-row__actual-cell" />
      <div className="budget-row__remaining-cell" />
      <div className="budget-row__pace-cell" />
      <div className="budget-row__lastmo-cell" />
      {/* Col 7: save/cancel */}
      <div className="budget-row__actions-cell">
        <button
          type="button"
          className="budget-row__action-btn budget-row__action-btn--save"
          onClick={() => void save()}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? '…' : <Check size={13} />} {isSaving ? '' : 'Save'}
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

// ── BudgetGroupRow ────────────────────────────────────────────────────────────

interface Props {
  group: BudgetGroup;
  forceCollapsed?: boolean;
  paceCtx: PaceContext;
  pendingCategoryId?: string;
  isAddingCategory: boolean;
  onUpdate: (
    categoryId: string,
    data: { planned?: number; isRecurring?: boolean; isUnplanned?: boolean },
  ) => Promise<unknown>;
  onAddCategory: (
    parentId: string,
    name: string,
    planned: number,
    isRecurring: boolean,
    isUnplanned: boolean,
  ) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function BudgetGroupRow({
  group,
  forceCollapsed,
  paceCtx,
  pendingCategoryId,
  isAddingCategory,
  onUpdate,
  onAddCategory,
  onRename,
  onDelete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const isIncome = group.type === 'INCOME';
  const catCount = group.categories.length;

  // Metrics
  const remaining = group.planned - group.actual;
  const hasPlanned = group.planned > 0;
  const remClass = hasPlanned
    ? isIncome
      ? remaining <= 0
        ? '--good'
        : '--bad'
      : remaining >= 0
        ? '--good'
        : '--bad'
    : '--muted';

  const hasLastMonth = group.lastMonthActual > 0;
  const delta = group.actual - group.lastMonthActual;
  const deltaGood = isIncome ? delta >= 0 : delta <= 0;

  const paceBadge = computeGroupPace(group.actual, group.planned, paceCtx, isIncome);

  useEffect(() => {
    if (forceCollapsed === true) {
      setIsExpanded(false);
      setShowAddForm(false);
    } else if (forceCollapsed === false) setIsExpanded(true);
  }, [forceCollapsed]);

  return (
    <div className="budget-group">
      {/*
        The header button uses the SAME 7-column grid as table-head and budget-row.
        Each direct child occupies one column — no wrapper divs.
      */}
      <button
        type="button"
        className="budget-group__header"
        onClick={() => setIsExpanded((v) => !v)}
        style={{ '--group-color': GROUP_COLOR[group.type] } as React.CSSProperties}
      >
        {/* Col 1 — Category name */}
        <span className="budget-group__name-cell">
          <ChevronRight
            size={14}
            className={`budget-group__chevron${isExpanded ? ' budget-group__chevron--open' : ''}`}
            aria-hidden
          />
          <span className="budget-group__name">{GROUP_LABEL[group.type] ?? group.name}</span>
          <span className="budget-group__count">
            {catCount} {catCount === 1 ? 'cat' : 'cats'}
          </span>
        </span>

        {/* Col 2 — Planned */}
        <span className={'budget-group__num budget-group__num--planned'}>
          {hasPlanned ? formatINR(group.planned) : '—'}
        </span>

        {/* Col 3 — Actual */}
        <span className="budget-group__num budget-group__num--actual">
          {group.actual > 0 ? formatINR(group.actual) : '—'}
        </span>

        {/* Col 4 — Remaining */}
        <span className={`budget-group__num budget-group__num--rem budget-group__num${remClass}`}>
          {hasPlanned
            ? remaining >= 0
              ? formatINR(remaining)
              : `−${formatINR(Math.abs(remaining))}`
            : '—'}
        </span>

        {/* Col 5 — Pace */}
        <span className="budget-group__pace-cell">
          {paceBadge ? (
            <span
              className={`budget-group__pace budget-group__pace--${paceBadge.status}`}
              title={paceBadge.tooltip}
            >
              {paceBadge.label}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>
          )}
        </span>

        {/* Col 6 — Last month */}
        <span className="budget-group__lastmo">
          {hasLastMonth ? (
            <>
              <span className="budget-group__lastmo-amount">
                {formatINR(group.lastMonthActual)}
              </span>
              {group.actual > 0 && Math.abs(delta) > 0 && (
                <span
                  className={`budget-group__lastmo-delta budget-group__lastmo-delta--${deltaGood ? 'good' : 'bad'}`}
                >
                  {delta >= 0 ? '▲' : '▼'}
                  {formatINR(Math.abs(delta))}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>
          )}
        </span>

        {/* Col 7 — Actions spacer */}
        <span className="budget-group__actions-spacer" />

        {/* Mobile-only: sub-line "planned X · spent Y" + pct */}
        <span className="budget-group__mobile-stats">
          <span className="budget-group__ms-detail">
            {hasPlanned && (
              <span className="budget-group__ms-planned">planned {formatINR(group.planned)}</span>
            )}
            {group.actual > 0 && (
              <span className="budget-group__ms-spent">spent {formatINR(group.actual)}</span>
            )}
          </span>
          {hasPlanned && group.actual > 0 && (
            <span className="budget-group__ms-pct">
              {Math.round((group.actual / group.planned) * 100)}%
            </span>
          )}
        </span>

        {/* Mobile-only: thin progress bar */}
        {hasPlanned && (
          <span
            className="budget-group__mobile-progress"
            style={{
              '--bar-pct': `${Math.min(Math.round((group.actual / group.planned) * 100), 100)}%`,
              '--bar-color': group.actual / group.planned > 1
                ? '#dc2626'
                : group.actual / group.planned >= 0.9
                  ? '#d97706'
                  : isIncome ? '#16a34a' : '#3b82f6',
            } as React.CSSProperties}
          />
        )}
      </button>

      {isExpanded && (
        <div className="budget-group__body">
          {group.categories.map((cat) => (
            <BudgetCategoryRow
              key={cat.id}
              node={cat}
              groupType={group.type}
              depth={1}
              paceCtx={paceCtx}
              pendingCategoryId={pendingCategoryId}
              onUpdate={onUpdate}
              onAddChild={(parentId, name, planned, isRec, isUnpl) =>
                onAddCategory(parentId, name, planned, isRec, isUnpl)
              }
              onRename={onRename}
              onDelete={onDelete}
              isAddingChild={isAddingCategory}
            />
          ))}

          {showAddForm ? (
            <InlineAddRow
              isSaving={isAddingCategory}
              onSave={async (name, planned) => {
                await onAddCategory(group.id, name, planned, false, false);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              className="budget-group__add-cat"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setShowAddForm(true);
              }}
            >
              <Plus size={13} /> Add category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
