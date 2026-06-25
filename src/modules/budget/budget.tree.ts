import {
  BUDGET_ESSENTIAL_VARIANTS,
  BUDGET_LINE_KIND,
  BUDGET_SECTION_VARIANT,
  BUDGET_SUMMARY_ID,
} from '@/constants/budget';
import type {
  BudgetLedgerMetrics,
  BudgetLedgerNode,
  BudgetLedgerPayload,
  BudgetLineRecord,
  BudgetSummaryRow,
} from './budget.types';

const PRISMA_KIND_MAP: Record<string, string> = {
  SECTION: BUDGET_LINE_KIND.SECTION,
  GROUP: BUDGET_LINE_KIND.GROUP,
  LINE: BUDGET_LINE_KIND.LINE,
};

const PRISMA_VARIANT_MAP: Record<string, string> = {
  INCOME: BUDGET_SECTION_VARIANT.INCOME,
  HOUSEHOLD: BUDGET_SECTION_VARIANT.HOUSEHOLD,
  INSURANCE: BUDGET_SECTION_VARIANT.INSURANCE,
  SINKING: BUDGET_SECTION_VARIANT.SINKING,
  SUBSCRIPTIONS: BUDGET_SECTION_VARIANT.SUBSCRIPTIONS,
  INVESTMENTS: BUDGET_SECTION_VARIANT.INVESTMENTS,
  EMIS: BUDGET_SECTION_VARIANT.EMIS,
  UNPLANNED: BUDGET_SECTION_VARIANT.UNPLANNED,
};

const PRISMA_TAG_MAP: Record<string, string> = {
  MANUAL: 'manual',
  AUTO: 'auto',
};

export function computeBudgetMetrics(
  plannedMinor: number,
  spentMinor: number,
): BudgetLedgerMetrics {
  const remainingMinor = plannedMinor - spentMinor;
  const percent =
    plannedMinor > 0 ? Math.min(Math.round((spentMinor / plannedMinor) * 100), 100) : 0;
  return { plannedMinor, spentMinor, remainingMinor, percent };
}

function toNode(line: BudgetLineRecord): BudgetLedgerNode {
  const metrics = computeBudgetMetrics(line.plannedMinor, line.spentMinor);
  return {
    id: line.id,
    title: line.title,
    kind: PRISMA_KIND_MAP[line.kind] ?? line.kind.toLowerCase(),
    variant: line.variant ? PRISMA_VARIANT_MAP[line.variant] : null,
    tag: line.tag ? PRISMA_TAG_MAP[line.tag] : null,
    note: line.note,
    typeLabel: line.typeLabel,
    sortOrder: line.sortOrder,
    ...metrics,
    children: [],
  };
}

export function buildBudgetTree(flat: BudgetLineRecord[]): BudgetLedgerNode[] {
  const nodes = new Map<string, BudgetLedgerNode>();
  const roots: BudgetLedgerNode[] = [];

  for (const line of flat) {
    nodes.set(line.id, toNode(line));
  }

  for (const line of flat) {
    const node = nodes.get(line.id)!;
    if (line.parentId && nodes.has(line.parentId)) {
      nodes.get(line.parentId)!.children!.push(node);
    } else if (!line.parentId) {
      roots.push(node);
    }
  }

  const sortNodes = (list: BudgetLedgerNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of list) {
      if (node.children?.length) sortNodes(node.children);
    }
  };

  sortNodes(roots);
  return roots;
}

function sumSection(node: BudgetLedgerNode): BudgetLedgerMetrics {
  if (node.kind === BUDGET_LINE_KIND.SECTION) {
    return computeBudgetMetrics(node.plannedMinor, node.spentMinor);
  }
  const children = node.children ?? [];
  const plannedMinor = children.reduce((sum, c) => sum + c.plannedMinor, 0);
  const spentMinor = children.reduce((sum, c) => sum + c.spentMinor, 0);
  return computeBudgetMetrics(plannedMinor, spentMinor);
}

function findSection(
  roots: BudgetLedgerNode[],
  variant: string,
): BudgetLedgerNode | undefined {
  return roots.find((r) => r.variant === variant);
}

function sumVariants(roots: BudgetLedgerNode[], variants: string[]): BudgetLedgerMetrics {
  let plannedMinor = 0;
  let spentMinor = 0;
  for (const variant of variants) {
    const section = findSection(roots, variant);
    if (section) {
      const m = sumSection(section);
      plannedMinor += m.plannedMinor;
      spentMinor += m.spentMinor;
    }
  }
  return computeBudgetMetrics(plannedMinor, spentMinor);
}

export function buildBudgetSummaries(roots: BudgetLedgerNode[]): BudgetSummaryRow[] {
  const income = findSection(roots, BUDGET_SECTION_VARIANT.INCOME);
  const incomeMetrics = income ? sumSection(income) : computeBudgetMetrics(0, 0);

  const essential = sumVariants(roots, BUDGET_ESSENTIAL_VARIANTS);
  const investments =
    findSection(roots, BUDGET_SECTION_VARIANT.INVESTMENTS) ?? null;
  const investmentsMetrics = investments
    ? sumSection(investments)
    : computeBudgetMetrics(0, 0);

  const expenseVariants = [
    ...BUDGET_ESSENTIAL_VARIANTS,
    BUDGET_SECTION_VARIANT.SUBSCRIPTIONS,
    BUDGET_SECTION_VARIANT.EMIS,
    BUDGET_SECTION_VARIANT.UNPLANNED,
  ];
  const expenses = sumVariants(roots, expenseVariants);
  const outflowPlanned = expenses.plannedMinor + investmentsMetrics.plannedMinor;
  const outflowSpent = expenses.spentMinor + investmentsMetrics.spentMinor;
  const outflow = computeBudgetMetrics(outflowPlanned, outflowSpent);

  const surplusPlanned = incomeMetrics.plannedMinor - outflow.plannedMinor;
  const surplusSpent = incomeMetrics.spentMinor - outflow.spentMinor;
  const surplus = computeBudgetMetrics(surplusPlanned, surplusSpent);

  return [
    {
      id: BUDGET_SUMMARY_ID.ESSENTIAL_TOTAL,
      title: 'TOTAL ESSENTIAL + PROTECTION + FUTURE FUNDS',
      ...essential,
    },
    {
      id: BUDGET_SUMMARY_ID.INVESTMENTS_TOTAL,
      title: 'TOTAL INVESTMENTS',
      tone: 'success',
      ...investmentsMetrics,
    },
    {
      id: BUDGET_SUMMARY_ID.MONTHLY_OUTFLOW,
      title: 'TOTAL MONTHLY OUTFLOW (EXPENSES + INVESTMENTS)',
      ...outflow,
    },
    {
      id: BUDGET_SUMMARY_ID.SURPLUS,
      title: 'SURPLUS (Income − Total Outflow)',
      tone: surplus.remainingMinor >= 0 ? 'success' : 'warning',
      ...surplus,
    },
  ];
}

export function buildBudgetLedgerPayload(flat: BudgetLineRecord[]): BudgetLedgerPayload {
  const rows = buildBudgetTree(flat);
  return { rows, summaries: buildBudgetSummaries(rows) };
}

/** Roll up section totals from descendants for display */
export function withRollupMetrics(node: BudgetLedgerNode): BudgetLedgerNode {
  if (node.kind === BUDGET_LINE_KIND.LINE || !node.children?.length) {
    return node;
  }
  const plannedMinor = node.children.reduce((s, c) => s + c.plannedMinor, 0);
  const spentMinor = node.children.reduce((s, c) => s + c.spentMinor, 0);
  return {
    ...node,
    ...computeBudgetMetrics(
      node.kind === BUDGET_LINE_KIND.SECTION ? node.plannedMinor || plannedMinor : plannedMinor,
      node.kind === BUDGET_LINE_KIND.SECTION ? node.spentMinor || spentMinor : spentMinor,
    ),
    children: node.children.map(withRollupMetrics),
  };
}

export function flattenBudgetNodes(nodes: BudgetLedgerNode[]): BudgetLedgerNode[] {
  const result: BudgetLedgerNode[] = [];
  const walk = (list: BudgetLedgerNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}
