import type { CategoryHierarchyNodeJson } from '@/components/common/CategoryHierarchy/schemas';
import { fromCategoryFlowType } from '@/constants/categories';
import type { CategoryTreeNode } from '@/modules/categories/categories.types';

function mapCategoryNode(node: CategoryTreeNode): CategoryHierarchyNodeJson {
  const emoji =
    node.icon && node.icon.length <= 4 && !node.icon.includes('-') ? node.icon : undefined;
  const icon = node.icon && !emoji ? node.icon : undefined;

  return {
    id: node.id,
    name: node.name,
    level: node.level as 0 | 1 | 2,
    ...(node.level === 0 ? { type: fromCategoryFlowType(node.type) } : {}),
    emoji,
    icon,
    color: node.color ?? undefined,
    readOnly: node.isSystem,
    children: node.children.map(mapCategoryNode),
  };
}

export function mapCategoryTreeToHierarchy(nodes: CategoryTreeNode[]): CategoryHierarchyNodeJson[] {
  return nodes.map(mapCategoryNode);
}
