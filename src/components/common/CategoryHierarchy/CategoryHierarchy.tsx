'use client';

import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  type CategoryHierarchyCrudHandlers,
  CategoryHierarchyTreeNode,
} from './CategoryHierarchyTreeNode';
import { getDefaultRootType } from './lib/resolveCategoryIcon';
import type { CategoryHierarchyConfigJson, CategoryHierarchyNodeJson } from './schemas';

export interface CategoryHierarchyProps extends CategoryHierarchyCrudHandlers {
  config: CategoryHierarchyConfigJson;
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  readOnly?: boolean;
  canEdit?: (node: CategoryHierarchyNodeJson) => boolean;
  canDelete?: (node: CategoryHierarchyNodeJson) => boolean;
  className?: string;
}

function toExpandedSet(ids: string[] | undefined): Set<string> {
  return new Set(ids ?? []);
}

function filterNodes(
  nodes: CategoryHierarchyNodeJson[],
  query: string,
): CategoryHierarchyNodeJson[] {
  const q = query.toLowerCase();
  return nodes.flatMap((node) => {
    const filteredChildren = filterNodes(node.children ?? [], q);
    if (node.name.toLowerCase().includes(q)) {
      return [{ ...node, children: node.children }];
    }
    if (filteredChildren.length > 0) {
      return [{ ...node, children: filteredChildren }];
    }
    return [];
  });
}

function collectIds(nodes: CategoryHierarchyNodeJson[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectIds(n.children ?? [])]);
}

function toExpandedSetFromNodes(nodes: CategoryHierarchyNodeJson[]): Set<string> {
  return new Set(collectIds(nodes));
}

export function CategoryHierarchy({
  config,
  defaultExpandedIds,
  expandedIds: controlledExpandedIds,
  onExpandedChange,
  readOnly = false,
  canEdit,
  canDelete,
  onCreate,
  onUpdate,
  onDelete,
  className = '',
}: CategoryHierarchyProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const initialExpanded = useMemo(
    () => toExpandedSet(defaultExpandedIds ?? config.defaultExpandedIds),
    [defaultExpandedIds, config.defaultExpandedIds],
  );

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(initialExpanded);

  const expandedSet = useMemo(() => {
    if (controlledExpandedIds) return toExpandedSet(controlledExpandedIds);
    return uncontrolledExpanded;
  }, [controlledExpandedIds, uncontrolledExpanded]);

  const handleToggleExpand = useCallback(
    (id: string) => {
      const next = new Set(expandedSet);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      if (controlledExpandedIds) {
        onExpandedChange?.([...next]);
        return;
      }

      setUncontrolledExpanded(next);
      onExpandedChange?.([...next]);
    },
    [controlledExpandedIds, expandedSet, onExpandedChange],
  );

  const displayNodes = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return config.nodes;
    return filterNodes(config.nodes, trimmed);
  }, [config.nodes, searchQuery]);

  // When searching, expand every visible node so matches are always visible
  const activeExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return expandedSet;
    return toExpandedSetFromNodes(displayNodes);
  }, [searchQuery, displayNodes, expandedSet]);

  const isEmpty = displayNodes.length === 0;

  return (
    <section
      className={[
        'cat-hierarchy',
        config.density === 'compact' && 'cat-hierarchy--compact',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={
        config.title && config.showHeader !== false ? 'cat-hierarchy-title' : undefined
      }
    >
      {config.showHeader !== false && (config.title || config.description) && (
        <header className="cat-hierarchy__header">
          {config.title && (
            <h2 id="cat-hierarchy-title" className="cat-hierarchy__title">
              {config.title}
            </h2>
          )}
          {config.description && <p className="cat-hierarchy__description">{config.description}</p>}
        </header>
      )}

      <div className="cat-hierarchy__card">
        <div className="cat-hierarchy__search-wrap">
          <Search className="cat-hierarchy__search-icon" aria-hidden />
          <input
            type="search"
            className="cat-hierarchy__search"
            placeholder="Find category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search categories"
          />
          {!searchQuery && (
            <button
              type="button"
              className="cat-hierarchy__collapse-btn"
              onClick={() => {
                const allIds = toExpandedSetFromNodes(config.nodes);
                const isAllExpanded = config.nodes.every((n) => uncontrolledExpanded.has(n.id));
                const next = isAllExpanded ? new Set<string>() : allIds;
                setUncontrolledExpanded(next);
                onExpandedChange?.([...next]);
              }}
            >
              {config.nodes.every((n) => uncontrolledExpanded.has(n.id))
                ? 'Collapse all'
                : 'Expand all'}
            </button>
          )}
        </div>

        {config.nodes.length === 0 && onCreate ? (
          <div className="cat-hierarchy__empty">
            <p className="cat-hierarchy__empty-title">No categories yet</p>
            <p className="cat-hierarchy__empty-description">
              Create a top-level group to start building your category tree. These categories are
              shared across the app (e.g. when logging transactions).
            </p>
            <div className="cat-hierarchy__empty-actions">
              {(['income', 'expense', 'investment'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className="cat-hierarchy__empty-btn"
                  onClick={() =>
                    onCreate({
                      parentId: null,
                      parentLevel: -1,
                      groupType: type,
                    })
                  }
                >
                  Add {type.charAt(0).toUpperCase() + type.slice(1)} group
                </button>
              ))}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="cat-hierarchy__empty">
            <p className="cat-hierarchy__empty-title">No results</p>
            <p className="cat-hierarchy__empty-description">
              No categories match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <ul className="cat-hierarchy__tree" role="tree" aria-label={config.ariaLabel}>
            {displayNodes.map((node) => {
              const variant = config.variant ?? 'category';
              const groupType = node.type ?? getDefaultRootType(variant);

              return (
                <CategoryHierarchyTreeNode
                  key={node.id}
                  node={node}
                  groupType={groupType}
                  variant={variant}
                  density={config.density}
                  crudMode={config.crudMode}
                  showBudget={config.showBudget}
                  expandedIds={activeExpandedIds}
                  onToggleExpand={handleToggleExpand}
                  readOnly={readOnly}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onCreate={onCreate}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
