'use client';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BUDGET_LINE_KIND } from '@/constants/budget';
import { Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BudgetLedgerCategoryCell, budgetSectionRowClassName } from './BudgetLedgerCategoryCell';
import { BudgetLedgerMobileCard } from './BudgetLedgerMobileCard';
import { BudgetLedgerSummaries } from './BudgetLedgerSummaries';
import { BudgetLineFormModal } from './BudgetLineFormModal';
import { BudgetPercentBar } from './BudgetPercentBar';
import { formatBudgetMoney } from './formatBudgetMoney';
import type { BudgetLedgerPayloadSchema, BudgetLineFormValues } from './schemas';
import { useBudgetLedgerTable } from './useBudgetLedgerTable';
import type { z } from 'zod';

export type BudgetLedgerPayloadJson = z.infer<typeof BudgetLedgerPayloadSchema>;

export type BudgetLedgerDensity = 'comfortable' | 'compact';

export interface BudgetLedgerProps {
  payload: BudgetLedgerPayloadJson;
  loading?: boolean;
  editable?: boolean;
  density?: BudgetLedgerDensity;
  onCreateLine?: (parentId: string | null, values: BudgetLineFormValues) => Promise<void>;
  onUpdateLine?: (id: string, values: BudgetLineFormValues) => Promise<void>;
  onDeleteLine?: (id: string) => Promise<void>;
  className?: string;
}

export function budgetLedgerClassName({
  density = 'comfortable',
  className = '',
}: {
  density?: BudgetLedgerDensity;
  className?: string;
}) {
  return ['budget-ledger', `budget-ledger--${density}`, className].filter(Boolean).join(' ');
}

export function BudgetLedger({
  payload,
  loading = false,
  editable = false,
  density = 'comfortable',
  onCreateLine,
  onUpdateLine,
  onDeleteLine,
  className = '',
}: BudgetLedgerProps) {
  const { table, visibleRows } = useBudgetLedgerTable({ rows: payload.rows });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const editingNode = useMemo(() => {
    if (!editingId) return null;
    const find = (nodes: typeof payload.rows): (typeof payload.rows)[number] | null => {
      for (const node of nodes) {
        if (node.id === editingId) return node;
        if (node.children) {
          const hit = find(node.children);
          if (hit) return hit;
        }
      }
      return null;
    };
    return find(payload.rows);
  }, [editingId, payload.rows]);

  const openCreate = (nextParentId: string | null) => {
    setEditingId(null);
    setParentId(nextParentId);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setParentId(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: BudgetLineFormValues) => {
    if (editingId && onUpdateLine) {
      await onUpdateLine(editingId, values);
      return;
    }
    if (onCreateLine) {
      await onCreateLine(parentId, values);
    }
  };

  if (loading) {
    return (
      <div className={budgetLedgerClassName({ density, className })}>
        <Skeleton height="calc(24 * var(--space-1))" />
        <Skeleton height="calc(48 * var(--space-1))" />
      </div>
    );
  }

  if (!payload.rows.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No budget lines yet"
        description="Add your first category to start tracking planned vs spent."
        actionLabel={editable ? 'Add category' : undefined}
        onAction={editable ? () => openCreate(null) : undefined}
      />
    );
  }

  return (
    <div className={budgetLedgerClassName({ density, className })}>
      {editable ? (
        <div className="budget-ledger__toolbar">
          <Button type="button" size="sm" onClick={() => openCreate(null)}>
            <Plus aria-hidden />
            Add line
          </Button>
        </div>
      ) : null}

      <div className="budget-ledger__desktop" role="region" aria-label="Budget table">
        <table className="budget-ledger__table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {header.isPlaceholder ? null : String(header.column.columnDef.header)}
                  </th>
                ))}
                {editable ? (
                  <th scope="col" className="budget-ledger__actions-head">
                    Actions
                  </th>
                ) : null}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const node = row.original;
              const sectionClass = budgetSectionRowClassName(node);
              return (
                <tr
                  key={row.id}
                  className={[
                    'budget-ledger__row',
                    sectionClass,
                    node.kind === BUDGET_LINE_KIND.LINE && 'budget-ledger__row--line',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td>
                    <BudgetLedgerCategoryCell row={row} />
                  </td>
                  <td className="budget-ledger__money">
                    {formatBudgetMoney(node.plannedMinor)}
                  </td>
                  <td className="budget-ledger__money">{formatBudgetMoney(node.spentMinor)}</td>
                  <td className="budget-ledger__money">
                    {formatBudgetMoney(node.remainingMinor)}
                  </td>
                  <td>
                    <BudgetPercentBar percent={node.percent} label={`${node.title} usage`} />
                  </td>
                  <td className="budget-ledger__notes">
                    {node.typeLabel ? <span>{node.typeLabel}</span> : null}
                    {node.note ? <span className="budget-ledger__note">{node.note}</span> : null}
                  </td>
                  {editable ? (
                    <td className="budget-ledger__actions">
                      {node.kind !== BUDGET_LINE_KIND.SECTION ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${node.title}`}
                            onClick={() => openEdit(node.id)}
                          >
                            <Pencil aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            aria-label={`Delete ${node.title}`}
                            onClick={() => onDeleteLine?.(node.id)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openCreate(node.id)}
                        >
                          <Plus aria-hidden />
                        </Button>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="budget-ledger__mobile" role="region" aria-label="Budget cards">
        {visibleRows.map((row) => (
          <BudgetLedgerMobileCard
            key={row.id}
            row={row}
            editable={editable}
            onEdit={openEdit}
            onDelete={onDeleteLine}
          />
        ))}
      </div>

      <BudgetLedgerSummaries summaries={payload.summaries} />

      {editable ? (
        <BudgetLineFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editingId ? 'Edit budget line' : 'Add budget line'}
          initial={
            editingNode
              ? {
                  title: editingNode.title,
                  plannedMinor: editingNode.plannedMinor,
                  spentMinor: editingNode.spentMinor,
                  note: editingNode.note ?? '',
                  typeLabel: editingNode.typeLabel ?? '',
                }
              : undefined
          }
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
