'use client';

import { Check, ChevronRight, Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export interface CategoryNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  children?: CategoryNode[];
}

export interface NestedCategoryPickerProps {
  categories: CategoryNode[];
  value?: string | null;
  onChange?: (id: string, path: string[]) => void;
  label?: string;
}

interface BreadcrumbItem {
  id: string;
  label: string;
  nodes: CategoryNode[];
}

export function NestedCategoryPicker({
  categories,
  value,
  onChange,
  label,
}: NestedCategoryPickerProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', label: 'All', nodes: categories },
  ]);
  const [search, setSearch] = useState('');

  const currentLevel = breadcrumbs[breadcrumbs.length - 1];

  const filteredNodes = search.trim()
    ? currentLevel.nodes.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
    : currentLevel.nodes;

  function drillInto(node: CategoryNode) {
    if (!node.children?.length) return;
    setSearch('');
    setBreadcrumbs((prev) => [...prev, { id: node.id, label: node.label, nodes: node.children! }]);
  }

  function navigateTo(index: number) {
    setSearch('');
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  }

  function handleSelect(node: CategoryNode) {
    const path = [...breadcrumbs.slice(1).map((b) => b.id), node.id];
    onChange?.(node.id, path);
  }

  return (
    <div className="nested-cat">
      {label && <div className="nested-cat__label">{label}</div>}

      {/* Breadcrumb navigation */}
      <nav className="nested-cat__breadcrumb" aria-label="Category path">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id} className="nested-cat__crumb-wrap">
            {i > 0 && <ChevronRight size={12} className="nested-cat__crumb-sep" aria-hidden />}
            <button
              type="button"
              className={[
                'nested-cat__crumb',
                i === breadcrumbs.length - 1 ? 'nested-cat__crumb--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => navigateTo(i)}
              aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
              disabled={i === breadcrumbs.length - 1}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </nav>

      {/* Search at current level */}
      <div className="nested-cat__search">
        <Search size={14} className="nested-cat__search-icon" aria-hidden />
        <input
          type="text"
          placeholder={`Search in ${currentLevel.label}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search in ${currentLevel.label}`}
        />
      </div>

      {/* Item list */}
      <div className="nested-cat__list" role="listbox" aria-label={currentLevel.label}>
        {filteredNodes.length === 0 && (
          <div className="nested-cat__empty">{search ? 'No results' : 'No items'}</div>
        )}
        {filteredNodes.map((node) => {
          const hasChildren = Boolean(node.children?.length);
          const isSelected = node.id === value;

          return (
            <button
              key={node.id}
              type="button"
              className={[
                'nested-cat__item',
                isSelected ? 'nested-cat__item--selected' : '',
                hasChildren ? 'nested-cat__item--has-children' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-selected={isSelected}
              onClick={() => (hasChildren ? drillInto(node) : handleSelect(node))}
            >
              <div className="nested-cat__item-left">
                {node.icon && (
                  <span
                    className="nested-cat__item-icon"
                    style={{
                      background: node.color
                        ? `color-mix(in srgb, ${node.color} 14%, transparent)`
                        : 'var(--color-bg-subtle)',
                      color: node.color ?? 'var(--color-text-muted)',
                    }}
                  >
                    {node.icon}
                  </span>
                )}
                <span className="nested-cat__item-name">{node.label}</span>
              </div>
              <div className="nested-cat__item-right">
                {hasChildren && (
                  <span className="nested-cat__item-count">{node.children!.length}</span>
                )}
                {hasChildren ? (
                  <ChevronRight size={14} className="nested-cat__item-chevron" aria-hidden />
                ) : (
                  isSelected && <Check size={14} className="nested-cat__check" aria-hidden />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
