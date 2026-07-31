import type { BudgetCategoryNode } from '../budget-engine.types';

export interface LeafWithParent {
  node: BudgetCategoryNode;
  parentName: string | null;
}

/**
 * Only leaf categories carry a user-set `planned`/`isUnplanned`/`isRecurring` — a
 * parent's own values are computed rollups of its children (see BudgetCategoryNode), so
 * reading a parent here would either double-count a child already counted underneath it
 * or read a rollup nobody actually set. The synthetic "Uncategorized" row is skipped
 * too: it has no real category id, so there's nothing a per-category feature could act
 * on. Shared by the Reports budget-flags (getBudgetFlags) and the dashboard's
 * recurring-cost widget so both walk the tree the same way.
 */
export function collectLeaves(
  nodes: BudgetCategoryNode[],
  parentName: string | null = null,
): LeafWithParent[] {
  const out: LeafWithParent[] = [];
  for (const node of nodes) {
    if (node.isVirtual) continue;
    if (node.children.length === 0) out.push({ node, parentName });
    else out.push(...collectLeaves(node.children, node.name));
  }
  return out;
}
