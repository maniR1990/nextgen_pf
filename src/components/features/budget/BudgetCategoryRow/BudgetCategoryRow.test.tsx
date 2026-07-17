import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
import type { PaceContext } from '../BudgetView/BudgetView';
import { BudgetCategoryRow } from './BudgetCategoryRow';

afterEach(() => cleanup());

const PACE_CTX: PaceContext = {
  daysElapsed: 5,
  daysInMonth: 31,
  isPast: false,
  isFuture: false,
};

function makeNode(overrides: Partial<BudgetCategoryNode> & { id: string }): BudgetCategoryNode {
  return {
    name: overrides.id,
    level: 1,
    icon: null,
    color: null,
    isSystem: false,
    isVirtual: false,
    isRecurring: false,
    isUnplanned: false,
    dueDay: null,
    isSettled: false,
    settledTransactionId: null,
    planned: 500,
    actual: 0,
    lastMonthActual: 0,
    variance: 0,
    variancePct: 0,
    progressPct: 0,
    children: [],
    ...overrides,
  };
}

function noop() {
  return Promise.resolve();
}

describe('BudgetCategoryRow — add-subcategory depth limit', () => {
  // Mirrors the real hierarchy: Grocery (depth 1) > Oil | Milk (depth 2) > milk (depth 3),
  // which is exactly CATEGORY_MAX_LEVEL (3) — the deepest level the API allows.
  it('shows "Add sub-item" at depth 1 (category level, e.g. Grocery)', () => {
    const node = makeNode({ id: 'grocery', level: 1, children: [] });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByTitle('Add sub-item')).toBeInTheDocument();
  });

  it('shows "Add sub-item" at depth 2 (subcategory level, e.g. Oil | Milk) — the fix', () => {
    const node = makeNode({ id: 'oil-milk', level: 2, children: [] });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={2}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByTitle('Add sub-item')).toBeInTheDocument();
  });

  it('does NOT show "Add sub-item" at depth 3 (already at CATEGORY_MAX_LEVEL, e.g. milk)', () => {
    const node = makeNode({ id: 'milk', level: 3, children: [] });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={3}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByTitle('Add sub-item')).not.toBeInTheDocument();
  });

  it('threads onAddChild down to a depth-2 child so IT can add its own sub-items', async () => {
    const user = userEvent.setup();
    const oilMilk = makeNode({ id: 'oil-milk', level: 2, children: [] });
    const grocery = makeNode({ id: 'grocery', level: 1, children: [oilMilk] });

    render(
      <BudgetCategoryRow
        node={grocery}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );

    // Expand Grocery to reveal its child, Oil | Milk
    await user.click(screen.getByRole('button', { name: /expand/i }));
    expect(screen.getByText('oil-milk')).toBeInTheDocument();

    // Oil | Milk (now rendered at depth 2) should have received onAddChild and show its own button
    const addButtons = screen.getAllByTitle('Add sub-item');
    expect(addButtons).toHaveLength(2); // Grocery's own + Oil | Milk's
  });

  it('does NOT thread onAddChild to a depth-3 grandchild (milk) — stops exactly at the limit', async () => {
    const user = userEvent.setup();
    const milk = makeNode({ id: 'milk', level: 3, children: [] });
    const oilMilk = makeNode({ id: 'oil-milk', level: 2, children: [milk] });
    const grocery = makeNode({ id: 'grocery', level: 1, children: [oilMilk] });

    render(
      <BudgetCategoryRow
        node={grocery}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand/i }));
    // Expand Oil | Milk to reveal milk
    const chevrons = screen.getAllByRole('button', { name: /expand/i });
    await user.click(chevrons[chevrons.length - 1]!);
    expect(screen.getByText('milk')).toBeInTheDocument();

    // Grocery + Oil | Milk get "Add sub-item"; milk (depth 3) must not.
    expect(screen.getAllByTitle('Add sub-item')).toHaveLength(2);
  });

  it('clicking "Add sub-item" opens the inline form and submits via onAddChild', async () => {
    const user = userEvent.setup();
    const onAddChild = vi.fn().mockResolvedValue(undefined);
    const node = makeNode({ id: 'oil-milk', level: 2, children: [] });

    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={2}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={onAddChild}
        onRename={noop}
        onDelete={noop}
      />,
    );

    await user.click(screen.getByTitle('Add sub-item'));
    const nameInput = screen.getByPlaceholderText('Item name…');
    await user.type(nameInput, 'Oil');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onAddChild).toHaveBeenCalledWith('oil-milk', 'Oil', 0, false, false);
  });

  it('does not offer "Add sub-item" at all when the caller passes no onAddChild', () => {
    const node = makeNode({ id: 'oil-milk', level: 2, children: [] });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={2}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByTitle('Add sub-item')).not.toBeInTheDocument();
  });
});

describe('BudgetCategoryRow — virtual Uncategorized row', () => {
  it('renders read-only: no rename, add, due-date, delete, recurring, or unplanned controls', () => {
    const node = makeNode({ id: 'uncategorized-EXPENSE', name: 'Uncategorized', isVirtual: true, actual: 1741 });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onAddChild={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByTitle('Add sub-item')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    expect(screen.queryByTitle(/rename/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/mark as recurring/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/mark as unplanned/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/due date/i)).not.toBeInTheDocument();
  });

  it('does not let the planned cell be clicked into edit mode', async () => {
    const user = userEvent.setup();
    const node = makeNode({ id: 'uncategorized-EXPENSE', name: 'Uncategorized', isVirtual: true, actual: 1741 });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByRole('button', { name: /edit planned amount/i })).not.toBeInTheDocument();
  });

  it('double-clicking the name does not open the rename input', async () => {
    const user = userEvent.setup();
    const node = makeNode({ id: 'uncategorized-EXPENSE', name: 'Uncategorized', isVirtual: true });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={1}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    await user.dblClick(screen.getByText('Uncategorized'));
    expect(screen.queryByDisplayValue('Uncategorized')).not.toBeInTheDocument();
  });
});

describe('BudgetCategoryRow — pace projection', () => {
  // 5 days elapsed of 31 — matches PACE_CTX above.
  it('marks a projected-over pace with "≈" and a tooltip explaining the math', () => {
    const node = makeNode({ id: 'vegies', level: 2, planned: 1000, actual: 500 });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={2}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    // dailyRate = 500/5 = 100; pace = 100*31 = 3100
    const badge = screen.getByText('≈₹3,100');
    expect(badge).toHaveAttribute(
      'title',
      'Spending ₹100/day → projected ₹3,100 by day 31',
    );
  });

  it('does not show a projection tooltip when comfortably on track', () => {
    const node = makeNode({ id: 'rice', level: 2, planned: 5000, actual: 100 });
    render(
      <BudgetCategoryRow
        node={node}
        groupType="EXPENSE"
        depth={2}
        paceCtx={PACE_CTX}
        onUpdate={noop}
        onRename={noop}
        onDelete={noop}
      />,
    );
    const badge = screen.getByText('On track');
    expect(badge).not.toHaveAttribute('title');
  });
});
