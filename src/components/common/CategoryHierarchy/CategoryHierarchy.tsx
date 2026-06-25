'use client';

import { useCallback, useMemo, useState } from 'react';
import { getDefaultRootType } from './lib/resolveCategoryIcon';
import {
  CategoryHierarchyTreeNode,
  type CategoryHierarchyCrudHandlers,
} from './CategoryHierarchyTreeNode';
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

  return (
    <section
      className={[
        'cat-hierarchy',
        config.density === 'compact' && 'cat-hierarchy--compact',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={config.title && config.showHeader !== false ? 'cat-hierarchy-title' : undefined}
    >
      {config.showHeader !== false && (config.title || config.description) && (
        <header className="cat-hierarchy__header">
          {config.title && (
            <h2 id="cat-hierarchy-title" className="cat-hierarchy__title">
              {config.title}
            </h2>
          )}
          {config.description && (
            <p className="cat-hierarchy__description">{config.description}</p>
          )}
        </header>
      )}

      <div className="cat-hierarchy__card">
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
        ) : (
        <ul className="cat-hierarchy__tree" role="tree" aria-label={config.ariaLabel}>
          {config.nodes.map((node) => {
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
                expandedIds={expandedSet}
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
