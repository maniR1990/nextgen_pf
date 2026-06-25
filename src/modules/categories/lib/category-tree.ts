import type { CategoryTreeNode } from '../categories.types';

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'category'
  );
}

export function buildPath(
  type: string,
  slug: string,
  parentPath?: string | null,
): string {
  if (parentPath) return `${parentPath}/${slug}`;
  return `${type.toLowerCase()}/${slug}`;
}

export function buildCategoryTree(
  flat: Array<Omit<CategoryTreeNode, 'children'> & { children?: CategoryTreeNode[] }>,
): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  for (const node of flat) {
    map.set(node.id, { ...node, children: [] });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    for (const node of nodes) sortChildren(node.children);
  };
  sortChildren(roots);

  return roots;
}

export function rollupMonthlySpend(nodes: CategoryTreeNode[]): void {
  const walk = (node: CategoryTreeNode): number => {
    let total = node.monthlySpend;
    for (const child of node.children) {
      total += walk(child);
    }
    node.monthlySpend = Math.round(total * 100) / 100;
    return node.monthlySpend;
  };
  for (const root of nodes) walk(root);
}

export function collectDescendantIds(
  flat: Array<{ id: string; parentId: string | null }>,
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of flat) {
      if (row.parentId && ids.has(row.parentId) && !ids.has(row.id)) {
        ids.add(row.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function isDescendant(
  flat: Array<{ id: string; parentId: string | null }>,
  ancestorId: string,
  candidateParentId: string,
): boolean {
  return collectDescendantIds(flat, ancestorId).has(candidateParentId);
}
