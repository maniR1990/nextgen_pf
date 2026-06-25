'use client';

import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';

export interface CategoryPickerOption {
  id: string;
  label: string;
  parentLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface CategoryPickerProps {
  options: CategoryPickerOption[];
  value?: string | null;
  onChange?: (id: string | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  clearable?: boolean;
  loading?: boolean;
  /** Called when the user wants to create a new item with the typed name. Returns the new item's id. */
  onCreate?: (name: string) => Promise<string>;
}

export function CategoryPicker({
  options,
  value,
  onChange,
  placeholder = 'Select category',
  label,
  error,
  clearable = true,
  loading = false,
  onCreate,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.id === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.parentLabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  const flatOptions = filtered; // flat list for keyboard navigation

  // Open/close side effects
  useEffect(() => {
    if (!open) {
      setQuery('');
      setFocusedIndex(-1);
      return;
    }
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Outside click + Escape
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelectorAll('[role="option"]')[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, flatOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && flatOptions[focusedIndex]) {
        selectOption(flatOptions[focusedIndex].id);
      }
    }
  }

  function selectOption(id: string) {
    onChange?.(id);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(null);
    setOpen(false);
  }

  const grouped = filtered.reduce<Record<string, CategoryPickerOption[]>>((acc, opt) => {
    const key = opt.parentLabel ?? '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {});

  return (
    <div className="cat-picker" ref={containerRef}>
      {label && (
        <label className="cat-picker__label" htmlFor={`cat-trigger-${listboxId}`}>
          {label}
        </label>
      )}
      <button
        id={`cat-trigger-${listboxId}`}
        type="button"
        className={[
          'cat-picker__trigger',
          open ? 'cat-picker__trigger--open' : '',
          error ? 'cat-picker__trigger--error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        <div className="cat-picker__trigger-left">
          {selected?.icon && (
            <span
              className="cat-picker__trigger-icon"
              style={{ background: selected.color ?? 'var(--color-bg-subtle)' }}
            >
              {selected.icon}
            </span>
          )}
          <span
            className={`cat-picker__trigger-text${!selected ? ' cat-picker__trigger-text--placeholder' : ''}`}
          >
            {selected?.label ?? placeholder}
          </span>
        </div>
        <div className="cat-picker__trigger-right">
          {clearable && selected && (
            <span
              className="cat-picker__clear"
              role="button"
              aria-label="Clear selection"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  handleClear(e as unknown as React.MouseEvent);
              }}
              tabIndex={0}
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`cat-picker__chevron${open ? ' cat-picker__chevron--open' : ''}`}
            aria-hidden
          />
        </div>
      </button>
      {error && (
        <span className="cat-picker__error" role="alert">
          {error}
        </span>
      )}

      {open && (
        <div
          id={listboxId}
          className="cat-picker__dropdown"
          role="listbox"
          aria-label={label ?? 'Category'}
        >
          <div className="cat-picker__search">
            <Search size={14} className="cat-picker__search-icon" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search categories…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search categories"
              aria-autocomplete="list"
              aria-controls={listboxId}
            />
          </div>
          <div className="cat-picker__list" ref={listRef}>
            {loading && (
              <div className="cat-picker__loading">
                <Loader2 size={16} className="cat-picker__loading-icon" />
                Loading…
              </div>
            )}
            {!loading && filtered.length === 0 && !onCreate && (
              <div className="cat-picker__empty">No categories found</div>
            )}
            {!loading &&
              Object.entries(grouped).map(([groupKey, opts]) => (
                <div key={groupKey}>
                  {groupKey && (
                    <div className="cat-picker__group-label" aria-hidden>
                      {groupKey}
                    </div>
                  )}
                  {opts.map((opt) => {
                    const flatIdx = flatOptions.indexOf(opt);
                    const isFocused = flatIdx === focusedIndex;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={opt.id === value}
                        className={[
                          'cat-picker__option',
                          opt.id === value ? 'cat-picker__option--selected' : '',
                          isFocused ? 'cat-picker__option--focused' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onMouseEnter={() => setFocusedIndex(flatIdx)}
                        onClick={() => selectOption(opt.id)}
                      >
                        <div className="cat-picker__option-left">
                          <span
                            className="cat-picker__option-dot"
                            style={{ background: opt.color ?? 'var(--color-text-muted)' }}
                            aria-hidden
                          />
                          {opt.icon && (
                            <span
                              className="cat-picker__option-icon"
                              style={{
                                background: opt.color
                                  ? `color-mix(in srgb, ${opt.color} 14%, transparent)`
                                  : 'var(--color-bg-subtle)',
                                color: opt.color ?? 'var(--color-text-muted)',
                              }}
                            >
                              {opt.icon}
                            </span>
                          )}
                          <div className="cat-picker__option-text">
                            <span className="cat-picker__option-name">{opt.label}</span>
                            {opt.parentLabel && (
                              <span className="cat-picker__option-parent">{opt.parentLabel}</span>
                            )}
                          </div>
                        </div>
                        {opt.id === value && (
                          <Check size={14} className="cat-picker__check" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

            {!loading &&
              onCreate &&
              query.trim() &&
              !filtered.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()) && (
                <button
                  type="button"
                  className="cat-picker__create-option"
                  disabled={creating}
                  onClick={async () => {
                    setCreating(true);
                    try {
                      const newId = await onCreate(query.trim());
                      selectOption(newId);
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <Plus size={13} aria-hidden />
                  {creating ? 'Creating…' : `Create "${query.trim()}"`}
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
