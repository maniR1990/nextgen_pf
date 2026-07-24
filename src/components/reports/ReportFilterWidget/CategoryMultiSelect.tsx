'use client';

import { isDescendant } from '@/modules/categories/lib/category-tree';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CategoryMultiSelectOption {
  id: string;
  label: string;
  parentLabel?: string;
  /** Real parent id, not just the display name — needed to detect an ancestor/descendant
   *  relationship between two options (see selectableOptions below). */
  parentId?: string | null;
}

interface CategoryMultiSelectProps {
  options: CategoryMultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
}

/**
 * Multi-pick category dropdown for report filtering — e.g. "Groceries" + "Household"
 * together in one query. Deliberately a separate component from the shared
 * CategoryPicker rather than adding a `multiple` mode to it: CategoryPicker is used by
 * transaction-entry forms where single-select is the correct, intentional behavior, and
 * bolting multi-select support on risks regressing that.
 */
export function CategoryMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'All categories',
  ariaLabel,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // A selected category already covers its whole subtree, so offering a sibling pick
  // that's an ancestor or descendant of it would either be a no-op (re-covering ground
  // already counted) or, worse, a silent double-count in the Planned total. Once
  // "Groceries" is selected, "Supermarket" underneath it drops out of the list — and
  // the reverse holds too, so picking order never matters. Already-selected options stay
  // visible regardless, or there'd be no way to toggle them back off from this list.
  const flatForAncestryCheck = useMemo(
    () => options.map((o) => ({ id: o.id, parentId: o.parentId ?? null })),
    [options],
  );

  const selectableOptions = useMemo(() => {
    if (value.length === 0) return options;
    return options.filter(
      (opt) =>
        value.includes(opt.id) ||
        !value.some(
          (selId) =>
            isDescendant(flatForAncestryCheck, selId, opt.id) ||
            isDescendant(flatForAncestryCheck, opt.id, selId),
        ),
    );
  }, [options, value, flatForAncestryCheck]);

  const filtered = query.trim()
    ? selectableOptions.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.parentLabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : selectableOptions;

  const grouped = filtered.reduce<Record<string, CategoryMultiSelectOption[]>>((acc, opt) => {
    const key = opt.parentLabel ?? '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {});

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = triggerRef.current;
    if (!anchor) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(Math.max(spaceBelow, 120), 320),
      });
    };
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(e.target as HTMLElement).closest?.('.cat-multiselect__dropdown')
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onOutside);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function clearAll(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    onChange([]);
  }

  const selectedLabels = value
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter((l): l is string => Boolean(l));
  const triggerText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} +${selectedLabels.length - 1} more`;

  return (
    <div className="cat-multiselect" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={['cat-multiselect__trigger', open && 'cat-multiselect__trigger--open']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
      >
        <span
          className={[
            'cat-multiselect__trigger-text',
            value.length === 0 && 'cat-multiselect__trigger-text--placeholder',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {triggerText}
        </span>
        <div className="cat-multiselect__trigger-right">
          {value.length > 0 && (
            <span
              className="cat-multiselect__clear"
              role="button"
              aria-label="Clear selection"
              onClick={clearAll}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') clearAll(e);
              }}
              tabIndex={0}
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`cat-multiselect__chevron${open ? ' cat-multiselect__chevron--open' : ''}`}
            aria-hidden
          />
        </div>
      </button>

      {open &&
        dropdownPos &&
        createPortal(
          <div
            id={listboxId}
            className="cat-multiselect__dropdown"
            role="listbox"
            aria-multiselectable="true"
            // Distinct from the trigger's own aria-label — this stays mounted alongside
            // the trigger while open (multi-select doesn't close on each pick), and an
            // identical label on both would make them indistinguishable by accessible
            // name alone.
            aria-label={`${ariaLabel} options`}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
              zIndex: 9999,
            }}
          >
            <div className="cat-multiselect__search">
              <Search size={14} className="cat-multiselect__search-icon" aria-hidden />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search categories…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search categories"
                aria-autocomplete="list"
                aria-controls={listboxId}
              />
            </div>
            <div className="cat-multiselect__list">
              {filtered.length === 0 && (
                <div className="cat-multiselect__empty">No categories found</div>
              )}
              {Object.entries(grouped).map(([groupKey, opts]) => (
                <div key={groupKey || 'ungrouped'}>
                  {groupKey && (
                    <div className="cat-multiselect__group-label" aria-hidden>
                      {groupKey}
                    </div>
                  )}
                  {opts.map((opt) => {
                    const checked = value.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={checked}
                        className={[
                          'cat-multiselect__option',
                          checked && 'cat-multiselect__option--selected',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => toggle(opt.id)}
                      >
                        <span
                          className={[
                            'cat-multiselect__checkbox',
                            checked && 'cat-multiselect__checkbox--checked',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-hidden
                        >
                          {checked && <Check size={12} />}
                        </span>
                        <span className="cat-multiselect__option-label">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
