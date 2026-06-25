import type { CategoryHierarchyNodeJson } from '../schemas';

export function createHierarchyChildNode(
  parent: CategoryHierarchyNodeJson,
  name: string,
): CategoryHierarchyNodeJson {
  return {
    id: `${parent.id}-${Date.now()}`,
    name,
    level: (parent.level + 1) as 0 | 1 | 2,
  };
}

export function addHierarchyChild(
  nodes: CategoryHierarchyNodeJson[],
  parentId: string,
  child: CategoryHierarchyNodeJson,
): CategoryHierarchyNodeJson[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), child],
      };
    }

    if (node.children?.length) {
      return {
        ...node,
        children: addHierarchyChild(node.children, parentId, child),
      };
    }

    return node;
  });
}

export function updateHierarchyNode(
  nodes: CategoryHierarchyNodeJson[],
  nodeId: string,
  patch: Partial<Pick<CategoryHierarchyNodeJson, 'name' | 'monthlyBudget' | 'emoji' | 'icon'>>,
): CategoryHierarchyNodeJson[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, ...patch };
    }

    if (node.children?.length) {
      return {
        ...node,
        children: updateHierarchyNode(node.children, nodeId, patch),
      };
    }

    return node;
  });
}

export function removeHierarchyNode(
  nodes: CategoryHierarchyNodeJson[],
  nodeId: string,
): CategoryHierarchyNodeJson[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) =>
      node.children?.length
        ? { ...node, children: removeHierarchyNode(node.children, nodeId) }
        : node,
    );
}
