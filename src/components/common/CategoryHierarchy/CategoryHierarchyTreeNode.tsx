'use client';

import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import {
  getHierarchyMeta,
  getHierarchyTypeTone,
  type HierarchyRootType,
} from '@/constants/category-hierarchy';
import type { HierarchyCrudMode, HierarchyDensity, HierarchyVariant } from '@/constants/settings';
import { Icon } from '@/components/ui/Icon';
import { formatINR } from '@/lib/utils/format';
import { CategoryHierarchyCrudActions } from './CategoryHierarchyCrudActions';
import type { CategoryHierarchyRowAction } from './CategoryHierarchyRowActions';
import { CategoryHierarchyIcon } from './lib/resolveCategoryIcon';
import type { CategoryHierarchyNodeJson } from './schemas';

export interface CategoryHierarchyCrudHandlers {
  onCreate?: (payload: {
    parentId: string | null;
    parentLevel: number;
    groupType: HierarchyRootType;
  }) => void;
  onUpdate?: (node: CategoryHierarchyNodeJson) => void;
  onDelete?: (node: CategoryHierarchyNodeJson) => void;
}

export interface CategoryHierarchyTreeNodeProps extends CategoryHierarchyCrudHandlers {
  node: CategoryHierarchyNodeJson;
  groupType: HierarchyRootType;
  variant: HierarchyVariant;
  density?: HierarchyDensity;
  crudMode?: HierarchyCrudMode;
  showBudget?: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  readOnly?: boolean;
  canEdit?: (node: CategoryHierarchyNodeJson) => boolean;
  canDelete?: (node: CategoryHierarchyNodeJson) => boolean;
}

function levelBadgeClass(
  level: 0 | 1 | 2,
  groupType: HierarchyRootType,
  variant: HierarchyVariant,
  density: HierarchyDensity,
): string {
  if (variant === 'category' && density === 'compact' && level > 0) {
    return level === 2 ? 'cat-hierarchy__badge--l2' : 'cat-hierarchy__badge--neutral';
  }

  const tone = getHierarchyTypeTone(variant, groupType, level);
  if (variant === 'category' && level === 2) return 'cat-hierarchy__badge--l2';
  return `cat-hierarchy__badge--${tone}`;
}

export function CategoryHierarchyTreeNode({
  node,
  groupType,
  variant,
  density = 'comfortable',
  crudMode = 'menu',
  showBudget = false,
  expandedIds,
  onToggleExpand,
  readOnly = false,
  canEdit,
  canDelete,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryHierarchyTreeNodeProps) {
  const meta = getHierarchyMeta(variant);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const canAddChild = !readOnly && node.level < meta.maxLevel;
  const nodeReadOnly = readOnly || node.readOnly === true;
  const levelLabel = meta.levelLabels[node.level];
  const budgetLabel =
    showBudget && typeof node.monthlyBudget === 'number' ? formatINR(node.monthlyBudget) : null;

  const rowActions: CategoryHierarchyRowAction[] = [
    ...(canAddChild && onCreate
      ? [
          {
            id: 'add-child' as const,
            label: meta.addLabels[node.level as 0 | 1],
            onAction: (target: CategoryHierarchyNodeJson) =>
              onCreate({
                parentId: target.id,
                parentLevel: target.level,
                groupType,
              }),
          },
        ]
      : []),
    ...(!nodeReadOnly && onUpdate && (canEdit?.(node) ?? true)
      ? [
          {
            id: 'edit' as const,
            label: 'Edit',
            onAction: onUpdate,
          },
        ]
      : []),
    ...(!nodeReadOnly && onDelete && (canDelete?.(node) ?? true)
      ? [
          {
            id: 'delete' as const,
            label: 'Delete',
            destructive: true,
            onAction: onDelete,
          },
        ]
      : []),
  ];

  return (
    <li className="cat-hierarchy__item" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div className={`cat-hierarchy__row cat-hierarchy__row--level-${node.level}`}>
        <div className="cat-hierarchy__row-main">
          {hasChildren ? (
            <button
              type="button"
              className="cat-hierarchy__toggle"
              aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
              aria-expanded={isExpanded}
              onClick={() => onToggleExpand(node.id)}
            >
              <Icon icon={isExpanded ? ChevronDown : ChevronRight} size="xs" tone="muted" />
            </button>
          ) : (
            <span className="cat-hierarchy__toggle-spacer" aria-hidden />
          )}

          <span
            className="cat-hierarchy__icon-box"
            style={node.color ? { backgroundColor: node.color } : undefined}
          >
            <CategoryHierarchyIcon node={node} groupType={groupType} variant={variant} />
          </span>

          <span
            className={[
              'cat-hierarchy__label',
              node.level === 0 && 'cat-hierarchy__label--group',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {node.name}
          </span>
        </div>

        <div className="cat-hierarchy__row-meta">
          {budgetLabel ? (
            <span className="cat-hierarchy__amount">{budgetLabel}</span>
          ) : null}

          {levelLabel ? (
            <span
              className={[
                'cat-hierarchy__badge',
                levelBadgeClass(node.level, groupType, variant, density),
                node.level === 0 && 'cat-hierarchy__badge--group',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {levelLabel}
            </span>
          ) : null}

          <CategoryHierarchyCrudActions node={node} actions={rowActions} mode={crudMode} />
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="cat-hierarchy__children" role="group">
          {children.map((child) => (
            <CategoryHierarchyTreeNode
              key={child.id}
              node={child}
              groupType={groupType}
              variant={variant}
              density={density}
              crudMode={crudMode}
              showBudget={showBudget}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              readOnly={readOnly}
              canEdit={canEdit}
              canDelete={canDelete}
              onCreate={onCreate}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {canAddChild && onCreate && (
            <li className="cat-hierarchy__add-row">
              <button
                type="button"
                className="cat-hierarchy__add-btn"
                onClick={() =>
                  onCreate({
                    parentId: node.id,
                    parentLevel: node.level,
                    groupType,
                  })
                }
              >
                <Icon icon={Plus} size="xs" tone="muted" />
                {meta.addLabels[node.level as 0 | 1]}
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
