'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import type { CategoryHierarchyNodeJson } from '../schemas';

export interface CategoryHierarchyRowAction {
  id: 'edit' | 'delete' | 'add-child';
  label: string;
  destructive?: boolean;
  onAction: (node: CategoryHierarchyNodeJson) => void;
}

interface CategoryHierarchyRowActionsProps {
  node: CategoryHierarchyNodeJson;
  actions: CategoryHierarchyRowAction[];
}

export function CategoryHierarchyRowActions({
  node,
  actions,
}: CategoryHierarchyRowActionsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="cat-hierarchy__row-menu" ref={rootRef}>
      <button
        type="button"
        className="cat-hierarchy__row-menu-trigger"
        aria-label={`Actions for ${node.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon icon={MoreHorizontal} size="sm" tone="muted" />
      </button>
      {open && (
        <div className="cat-hierarchy__row-menu-panel" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={[
                'cat-hierarchy__row-menu-item',
                action.destructive && 'cat-hierarchy__row-menu-item--danger',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                action.onAction(node);
                setOpen(false);
              }}
            >
              {action.id === 'edit' && <Icon icon={Pencil} size="xs" tone="inherit" aria-hidden />}
              {action.id === 'delete' && <Icon icon={Trash2} size="xs" tone="inherit" aria-hidden />}
              {action.id === 'add-child' && <Icon icon={Plus} size="xs" tone="inherit" aria-hidden />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
