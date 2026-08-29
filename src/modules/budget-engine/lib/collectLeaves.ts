import type { BudgetCategoryNode } from '../budget-engine.types';

export interface LeafWithParent {
  node: BudgetCategoryNode;
  parentName: string | null;
}

/**
 * A category with children is normally just an organizational folder — its `planned`/
 * `actual` are rollups of what's underneath it (see BudgetCategoryNode), not a real
 * per-category figure a feature like Unplanned Expenses or Over-Budget Breakdown should
 * act on directly. But nothing anywhere in this app stops a transaction (or a Budget
 * plan) from being attached to a category that has subcategories — the category picker
 * doesn't restrict selection to leaves, and a category can grow a child well after
 * transactions already point at it. When that happens, the category's own direct data
 * (`ownActual`/`ownPlanned`/`isUnplanned`/`isRecurring`) is real and belongs to it
 * specifically, not to any of its children — dropping it here would silently lose that
 * money from every per-category report while it kept counting fine in every rolled-up
 * total above it, which is exactly the bug this fixed (a transaction correctly flagged
 * "Unplanned" never appeared in the Unplanned Expenses list because its category had
 * quietly grown a subcategory since).
 *
 * So a node is included here if it's a genuine leaf (no children), OR it has children
 * but also carries its own real data — in which case it's included *in addition to*
 * recursing into its children, not instead of. Callers must read `ownActual`/
 * `ownPlanned`, never `actual`/`planned`, for a node that reaches this point still
 * having children — those are already-rolled-up totals that would double-count
 * whatever the children report separately.
 *
 * The synthetic "Uncategorized" row is always skipped — it has no real category id, so
 * there's nothing a per-category feature could act on. Shared by the Reports
 * budget-flags (getBudgetFlags) and the dashboard's recurring-cost widget so both walk
 * the tree the same way.
 */
export function collectLeaves(
  nodes: BudgetCategoryNode[],
  parentName: string | null = null,
): LeafWithParent[] {
  const out: LeafWithParent[] = [];
  for (const node of nodes) {
    if (node.isVirtual) continue;
    const hasOwnData = node.ownActual > 0 || node.isUnplanned || node.isRecurring;
    if (node.children.length === 0) {
      out.push({ node, parentName });
    } else {
      if (hasOwnData) out.push({ node, parentName });
      out.push(...collectLeaves(node.children, node.name));
    }
  }
  return out;
}
