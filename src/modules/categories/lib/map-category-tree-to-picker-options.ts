import { fromCategoryFlowType } from '@/constants/categories';
import type { CategoryTreeNode } from '../categories.types';

export interface CategoryPickerFlatOption {
  id: string;
  label: string;
  parentLabel?: string;
  /** The category's actual parent id (not just its display name) — name alone can't
   *  answer "is A an ancestor/descendant of B" reliably (names aren't guaranteed unique
   *  across different branches of the tree). Used by the report multi-select to prevent
   *  selecting a category together with one of its own ancestors or descendants. */
  parentId: string | null;
  depth: number;
  type: string;
  icon?: string;
  color?: string;
}

export interface PickerL3Item {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface PickerL2Item {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isLeaf: boolean;
  children: PickerL3Item[];
}

export interface PickerL1Item {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isLeaf: boolean;
  children: PickerL2Item[];
}

export interface PickerGroup {
  id: string;
  name: string;
  type: string;
  children: PickerL1Item[];
}

function pushOption(
  options: CategoryPickerFlatOption[],
  node: CategoryTreeNode,
  parentLabel: string | undefined,
  depth: number,
) {
  options.push({
    id: node.id,
    label: node.name,
    parentLabel,
    parentId: node.parentId,
    depth,
    type: fromCategoryFlowType(node.type),
    icon: node.icon ?? undefined,
    color: node.color ?? undefined,
  });
}

function walkTree(
  nodes: CategoryTreeNode[],
  options: CategoryPickerFlatOption[],
  groupName?: string,
  categoryName?: string,
) {
  for (const node of nodes) {
    if (node.level === 0) {
      walkTree(node.children, options, node.name);
    } else if (node.level === 1) {
      if (node.children.length === 0) {
        pushOption(options, node, groupName, 1);
      } else {
        walkTree(node.children, options, groupName, node.name);
      }
    } else if (node.level === 2) {
      pushOption(options, node, categoryName, 2);
    }
  }
}

/** Flatten category tree into selectable picker options (L2 subcategories; leaf L1). */
export function mapCategoryTreeToPickerOptions(
  nodes: CategoryTreeNode[],
): CategoryPickerFlatOption[] {
  const options: CategoryPickerFlatOption[] = [];
  walkTree(nodes, options);
  return options;
}

// Reporting needs the opposite bias from transaction entry: entry wants only leaf
// categories (you log a purchase as "Supermarket", never the broad "Groceries" bucket),
// but a report needs to let someone pick "Groceries" itself and see every subcategory's
// spend rolled into it. So an L1 node is always selectable here, whether or not it has
// children — and if it does, its children stay individually selectable too.
function walkTreeForReports(
  nodes: CategoryTreeNode[],
  options: CategoryPickerFlatOption[],
  groupName?: string,
  categoryName?: string,
) {
  for (const node of nodes) {
    if (node.level === 0) {
      walkTreeForReports(node.children, options, node.name);
    } else if (node.level === 1) {
      pushOption(options, node, groupName, 1);
      if (node.children.length > 0) {
        walkTreeForReports(node.children, options, groupName, node.name);
      }
    } else if (node.level === 2) {
      pushOption(options, node, categoryName, 2);
    }
  }
}

/** Flatten category tree for report filtering — every level is selectable, not leaf-only. */
export function mapCategoryTreeToReportPickerOptions(
  nodes: CategoryTreeNode[],
): CategoryPickerFlatOption[] {
  const options: CategoryPickerFlatOption[] = [];
  walkTreeForReports(nodes, options);
  return options;
}

/** Build grouped picker structure for the cascading category picker (L0 → L1 → L2). */
export function buildPickerGroups(nodes: CategoryTreeNode[]): PickerGroup[] {
  return nodes
    .filter((n) => n.level === 0)
    .map((group) => ({
      id: group.id,
      name: group.name,
      type: fromCategoryFlowType(group.type),
      children: group.children.map((l1) => ({
        id: l1.id,
        name: l1.name,
        icon: l1.icon ?? undefined,
        color: l1.color ?? undefined,
        isLeaf: l1.children.length === 0,
        children: l1.children.map((l2) => ({
          id: l2.id,
          name: l2.name,
          icon: l2.icon ?? undefined,
          color: l2.color ?? undefined,
          isLeaf: l2.children.length === 0,
          children: l2.children.map((l3) => ({
            id: l3.id,
            name: l3.name,
            icon: l3.icon ?? undefined,
            color: l3.color ?? undefined,
          })),
        })),
      })),
    }));
}
