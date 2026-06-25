'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import type { HierarchyCrudMode } from '@/constants/settings';
import type { CategoryHierarchyNodeJson } from '../schemas';
import type { CategoryHierarchyRowAction } from './CategoryHierarchyRowActions';
import { CategoryHierarchyRowActions } from './CategoryHierarchyRowActions';

interface CategoryHierarchyCrudActionsProps {
  node: CategoryHierarchyNodeJson;
  actions: CategoryHierarchyRowAction[];
  mode?: HierarchyCrudMode;
}

export function CategoryHierarchyCrudActions({
  node,
  actions,
  mode = 'menu',
}: CategoryHierarchyCrudActionsProps) {
  if (actions.length === 0) return null;

  if (mode === 'menu') {
    return <CategoryHierarchyRowActions node={node} actions={actions} />;
  }

  return (
    <div className="cat-hierarchy__inline-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={[
            'cat-hierarchy__inline-action',
            action.destructive && 'cat-hierarchy__inline-action--danger',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={`${action.label} ${node.name}`}
          onClick={() => action.onAction(node)}
        >
          {action.id === 'edit' && <Icon icon={Pencil} size="xs" tone="inherit" />}
          {action.id === 'delete' && <Icon icon={Trash2} size="xs" tone="inherit" />}
          {action.id === 'add-child' && <Icon icon={Plus} size="xs" tone="inherit" />}
        </button>
      ))}
    </div>
  );
}
