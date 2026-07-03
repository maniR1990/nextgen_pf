'use client';

import { DayOfMonthPicker } from '@/components/common/DayOfMonthPicker';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
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
): { status: PaceStatus; label: string } | null {
  // No planned budget = no reference to pace against; show nothing.
  if (planned === 0 || actual === 0 || ctx.isFuture || ctx.daysElapsed === 0) return null;
  if (ctx.isPast || ctx.daysElapsed === ctx.daysInMonth)
    return { status: 'past', label: 'Month done' };

  const pace = Math.round((actual / ctx.daysElapsed) * ctx.daysInMonth);
  const label = formatINR(pace);

  const ratio = pace / planned;
  if (isIncome) {
    if (ratio >= 1) return { status: 'good', label: 'On track' };
    if (ratio >= 0.8) return { status: 'warn', label };
    return { status: 'over', label };
  }
  if (ratio <= 1) return { status: 'good', label: 'On track' };
  if (ratio <= 1.1) return { status: 'warn', label };
  return { status: 'over', label };
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlanned, setEditP] = useState(false);
  const [draftPlanned, setDraftP] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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
    const v = Number(draftPlanned);
    if (!Number.isNaN(v) && v >= 0 && v !== node.planned) await onUpdate(node.id, { planned: v });
    // #4 Keyboard Tab: move to next editable planned cell
    if (moveNext) focusNextPlannedCell(node.id);
  }

  async function commitRename() {
    setRenamingId(null);
    const t = draftName.trim();
    if (t && t !== node.name) await onRename(node.id, t);
  }

  async function handleDelete() {
    const msg = hasChildren
      ? `Delete "${node.name}" and all its sub-items? Transactions will be un-categorised.`
      : `Delete "${node.name}"? Transactions will be un-categorised.`;
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
              className="budget-row__name"
              onDoubleClick={
                node.level === 0
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
            <span className="budget-row__badge budget-row__badge--rec" title="Recurring">
              ↻
            </span>
          )}
          {node.isUnplanned && (
            <span className="budget-row__badge budget-row__badge--unplanned" title="Unplanned">
              ⚡
            </span>
          )}
          {!isParent && node.dueDay && (
            <span className="budget-row__badge budget-row__badge--due" title="Due date">
              Due {node.dueDay}
              {ordinal(node.dueDay)}
            </span>
          )}
        </div>

        {/* ── Col 2: Planned ──
            Parent = rollup (computed, not editable) — shown in secondary style.
            Leaf   = user-set (editable) — shown in blue.                        */}
        {isParent ? (
          /* Rollup: computed sum, not editable */
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
              <span className="budget-row__amount budget-row__amount--planned">
                {node.planned > 0 ? (
                  formatINR(node.planned)
                ) : (
                  <span className="budget-row__amount--placeholder">+ Set budget</span>
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
            <span
              className={`budget-row__rem budget-row__rem${remMod}${isParent ? ' budget-row__rem--rollup' : ''}`}
            >
              {remaining >= 0 ? formatINR(remaining) : `−${formatINR(Math.abs(remaining))}`}
            </span>
          ) : (
            <span className="budget-row__rem budget-row__rem--muted">—</span>
          )}
        </div>

        {/* ── Col 5: Pace ── */}
        <div className="budget-row__pace-cell">
          {paceBadge ? (
            <span className={`budget-row__pace budget-row__pace--${paceBadge.status}`}>
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

        {/* ── Col 7: Action icons (reveal on hover) ── */}
        <div className="budget-row__actions-cell">
          <button
            type="button"
            className={`budget-row__icon-btn budget-row__icon-btn--rec${node.isRecurring ? ' budget-row__icon-btn--active-rec' : ''}`}
            title={node.isRecurring ? 'Recurring ON — click to turn off' : 'Mark as recurring'}
            onClick={() => void onUpdate(node.id, { isRecurring: !node.isRecurring })}
            disabled={isSaving}
          >
            <RefreshCw size={11} />
          </button>
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
          {onAddChild && depth < 2 && (
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

        {/* Mobile-only: sub-line "planned X · spent Y" + pct */}
        <div className="budget-row__mobile-stats">
          <span className="budget-row__ms-detail">
            {node.planned > 0 && (
              <span className="budget-row__ms-planned">planned {formatINR(node.planned)}</span>
            )}
            {hasActual && (
              <span className="budget-row__ms-spent">spent {formatINR(node.actual)}</span>
            )}
          </span>
          {node.planned > 0 && hasActual && (
            <span className="budget-row__ms-pct">
              {Math.round(node.progressPct)}%
            </span>
          )}
        </div>

        {/* Mobile-only: thin progress bar */}
        {node.planned > 0 && (
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
            onAddChild={depth < 1 ? onAddChild : undefined}
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
