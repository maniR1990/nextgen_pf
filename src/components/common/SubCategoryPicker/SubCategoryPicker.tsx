'use client';

import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export interface ChildCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ParentCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  children: ChildCategory[];
}

export interface SubCategoryPickerProps {
  categories: ParentCategory[];
  value?: string | null;
  onChange?: (childId: string, parentId: string) => void;
  label?: string;
}

export function SubCategoryPicker({ categories, value, onChange, label }: SubCategoryPickerProps) {
  const [activeParentId, setActiveParentId] = useState<string | null>(categories[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<'parent' | 'child'>('parent');
  const [search, setSearch] = useState('');

  const activeParent = categories.find((c) => c.id === activeParentId);

  // Find which parent contains the currently selected child
  const selectedParent = value
    ? categories.find((c) => c.children.some((ch) => ch.id === value))
    : null;

  function handleChildSelect(childId: string, parentId: string) {
    onChange?.(childId, parentId);
    setMobileView('parent');
  }

  function handleParentClick(parentId: string) {
    setActiveParentId(parentId);
    setSearch('');
    setMobileView('child');
  }

  const filteredChildren =
    activeParent?.children.filter(
      (ch) => !search.trim() || ch.label.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div className="subcat-picker">
      {label && <div className="subcat-picker__label">{label}</div>}

      {/* Desktop: two-pane */}
      <div className="subcat-picker__panes">
        {/* Left pane: parents */}
        <div className="subcat-picker__left">
          <div className="subcat-picker__pane-header" aria-hidden>
            Category
          </div>
          <div role="listbox" aria-label="Parent categories">
            {categories.map((cat) => {
              const selectedChild = cat.children.find((ch) => ch.id === value);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={[
                    'subcat-picker__parent-item',
                    cat.id === activeParentId ? 'subcat-picker__parent-item--active' : '',
                    selectedChild ? 'subcat-picker__parent-item--has-selection' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-selected={cat.id === activeParentId}
                  onClick={() => setActiveParentId(cat.id)}
                >
                  <div className="subcat-picker__parent-left">
                    {cat.icon && (
                      <span
                        className="subcat-picker__parent-icon"
                        style={{
                          background: cat.color
                            ? `color-mix(in srgb, ${cat.color} 14%, transparent)`
                            : 'var(--color-bg-subtle)',
                          color: cat.color ?? 'var(--color-text-muted)',
                        }}
                      >
                        {cat.icon}
                      </span>
                    )}
                    <div className="subcat-picker__parent-text">
                      <span className="subcat-picker__parent-name">{cat.label}</span>
                      {selectedChild && (
                        <span className="subcat-picker__parent-selected">
                          {selectedChild.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="subcat-picker__parent-right">
                    <span className="subcat-picker__count">{cat.children.length}</span>
                    <ChevronRight size={14} aria-hidden />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right pane: children + search */}
        <div className="subcat-picker__right">
          {activeParent && (
            <div className="subcat-picker__pane-header" aria-hidden>
              {activeParent.label}
            </div>
          )}
          <div className="subcat-picker__right-search">
            <Search size={14} className="subcat-picker__search-icon" aria-hidden />
            <input
              type="text"
              placeholder={`Search in ${activeParent?.label ?? ''}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={`Search ${activeParent?.label ?? 'subcategories'}`}
            />
          </div>
          <div role="listbox" aria-label={activeParent?.label ?? 'Subcategories'}>
            {filteredChildren.length === 0 && (
              <div className="subcat-picker__empty">No results</div>
            )}
            {filteredChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                className={[
                  'subcat-picker__child-item',
                  child.id === value ? 'subcat-picker__child-item--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-selected={child.id === value}
                onClick={() => activeParent && handleChildSelect(child.id, activeParent.id)}
              >
                <div className="subcat-picker__child-left">
                  {child.icon && <span className="subcat-picker__child-icon">{child.icon}</span>}
                  {child.label}
                </div>
                {child.id === value && (
                  <Check size={14} className="subcat-picker__check" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: drill-down */}
      <div className="subcat-picker__mobile">
        {mobileView === 'parent' && (
          <div className="subcat-picker__mobile-list" role="listbox" aria-label="Parent categories">
            {categories.map((cat) => {
              const selectedChild = cat.children.find((ch) => ch.id === value);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={[
                    'subcat-picker__parent-item',
                    selectedChild ? 'subcat-picker__parent-item--has-selection' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleParentClick(cat.id)}
                >
                  <div className="subcat-picker__parent-left">
                    {cat.icon && (
                      <span
                        className="subcat-picker__parent-icon"
                        style={{
                          background: cat.color
                            ? `color-mix(in srgb, ${cat.color} 14%, transparent)`
                            : 'var(--color-bg-subtle)',
                          color: cat.color ?? 'var(--color-text-muted)',
                        }}
                      >
                        {cat.icon}
                      </span>
                    )}
                    <div className="subcat-picker__parent-text">
                      <span className="subcat-picker__parent-name">{cat.label}</span>
                      {selectedChild && (
                        <span className="subcat-picker__parent-selected">
                          {selectedChild.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="subcat-picker__parent-right">
                    <span className="subcat-picker__count">{cat.children.length}</span>
                    <ChevronRight size={14} aria-hidden />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {mobileView === 'child' && activeParent && (
          <>
            <button
              type="button"
              className="subcat-picker__mobile-back"
              onClick={() => {
                setMobileView('parent');
                setSearch('');
              }}
            >
              <ChevronLeft size={16} aria-hidden />
              {activeParent.label}
            </button>
            <div className="subcat-picker__right-search">
              <Search size={14} className="subcat-picker__search-icon" aria-hidden />
              <input
                type="text"
                placeholder={`Search in ${activeParent.label}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={`Search ${activeParent.label}`}
              />
            </div>
            <div
              className="subcat-picker__mobile-list"
              role="listbox"
              aria-label={activeParent.label}
            >
              {filteredChildren.length === 0 && (
                <div className="subcat-picker__empty">No results</div>
              )}
              {filteredChildren.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={[
                    'subcat-picker__child-item',
                    child.id === value ? 'subcat-picker__child-item--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-selected={child.id === value}
                  onClick={() => handleChildSelect(child.id, activeParent.id)}
                >
                  <div className="subcat-picker__child-left">
                    {child.icon && <span className="subcat-picker__child-icon">{child.icon}</span>}
                    {child.label}
                  </div>
                  {child.id === value && (
                    <Check size={14} className="subcat-picker__check" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
