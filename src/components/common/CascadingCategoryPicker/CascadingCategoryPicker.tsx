'use client';

import { CategoryPicker } from '@/components/common/CategoryPicker';
import type { CategoryPickerOption } from '@/components/common/CategoryPicker';
import type {
  PickerGroup,
  PickerL1Item,
  PickerL2Item,
} from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { Search, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FlatSearchResult {
  id: string;
  label: string;
  breadcrumb: string; // e.g. "Food & Dining › Groceries"
  l1Id: string;
  l2Id: string | null;
}

function buildFlatIndex(groups: PickerGroup[]): FlatSearchResult[] {
  const results: FlatSearchResult[] = [];
  for (const group of groups) {
    for (const l1 of group.children) {
      if (l1.isLeaf) {
        results.push({
          id: l1.id,
          label: l1.name,
          breadcrumb: group.name,
          l1Id: l1.id,
          l2Id: null,
        });
      }
      for (const l2 of l1.children) {
        results.push({
          id: l2.id,
          label: l2.name,
          breadcrumb: `${l1.name}`,
          l1Id: l1.id,
          l2Id: l2.id,
        });
        for (const l3 of l2.children) {
          results.push({
            id: l3.id,
            label: l3.name,
            breadcrumb: `${l1.name} › ${l2.name}`,
            l1Id: l1.id,
            l2Id: l2.id,
          });
        }
      }
    }
  }
  return results;
}

export interface CascadingCategoryPickerProps {
  groups: PickerGroup[];
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  error?: string;
  loading?: boolean;
  /** Which group type to float to the top of the list (e.g. 'EXPENSE', 'INCOME'). */
  priorityGroupType?: string;
  /** Creates a new top-level category. Caller must inject the right flow type. */
  onCreateL1?: (name: string) => Promise<string>;
  /** Creates a new sub-category under the currently selected main category. */
  onCreateL2?: (name: string, parentId: string) => Promise<string>;
  /** Creates a new specific item under the currently selected sub-category. */
  onCreateL3?: (name: string, parentId: string) => Promise<string>;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function findL1ForValue(groups: PickerGroup[], id: string | null): PickerL1Item | null {
  if (!id) return null;
  for (const group of groups) {
    for (const l1 of group.children) {
      if (l1.id === id) return l1;
      for (const l2 of l1.children) {
        if (l2.id === id) return l1;
        if (l2.children.some((l3) => l3.id === id)) return l1;
      }
    }
  }
  return null;
}

function findL2ForValue(groups: PickerGroup[], id: string | null): PickerL2Item | null {
  if (!id) return null;
  for (const group of groups) {
    for (const l1 of group.children) {
      for (const l2 of l1.children) {
        if (l2.id === id) return l2;
        if (l2.children.some((l3) => l3.id === id)) return l2;
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────

export function CascadingCategoryPicker({
  groups,
  value,
  onChange,
  label,
  error,
  loading,
  priorityGroupType,
  onCreateL1,
  onCreateL2,
  onCreateL3,
}: CascadingCategoryPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Measure after every render where dropdown is open — useLayoutEffect fires
  // after DOM paint, so getBoundingClientRect() reflects the actual on-screen position.
  useLayoutEffect(() => {
    if (!searchOpen) return;
    const anchor = searchRef.current;
    if (!anchor) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(spaceBelow, 120),
      });
    };
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [searchOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const flatIndex = useMemo(() => buildFlatIndex(groups), [groups]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return flatIndex
      .filter((r) => r.label.toLowerCase().includes(q) || r.breadcrumb.toLowerCase().includes(q))
      .slice(0, 12);
  }, [flatIndex, searchQuery]);

  function handleSearchSelect(result: FlatSearchResult) {
    setActiveL1Id(result.l1Id);
    setActiveL2Id(result.l2Id);
    onChange(result.id);
    setSearchQuery('');
    setSearchOpen(false);
  }

  function clearSearch() {
    setSearchQuery('');
    setSearchOpen(false);
    searchInputRef.current?.focus();
  }

  // Sort groups so the priority group floats to the top; order of the rest is preserved.
  const sortedGroups = useMemo(() => {
    if (!priorityGroupType) return groups;
    const pt = priorityGroupType.toLowerCase();
    return [...groups].sort((a, b) => {
      if (a.type.toLowerCase() === pt) return -1;
      if (b.type.toLowerCase() === pt) return 1;
      return 0;
    });
  }, [groups, priorityGroupType]);

  const allL1s = useMemo(() => sortedGroups.flatMap((g) => g.children), [sortedGroups]);

  const [activeL1Id, setActiveL1Id] = useState<string | null>(
    () => findL1ForValue(groups, value)?.id ?? null,
  );
  const [activeL2Id, setActiveL2Id] = useState<string | null>(
    () => findL2ForValue(groups, value)?.id ?? null,
  );

  // Sync when value changes externally (form reset / edit prefill) OR when
  // groups update — e.g. after creating a new category, the refetch brings in
  // the new node; without groups in the deps the find returns null on stale data.
  useEffect(() => {
    setActiveL1Id(findL1ForValue(groups, value)?.id ?? null);
    setActiveL2Id(findL2ForValue(groups, value)?.id ?? null);
  }, [value, groups]);

  const activeL1 = useMemo(
    () => allL1s.find((l1) => l1.id === activeL1Id) ?? null,
    [allL1s, activeL1Id],
  );

  const activeL2 = useMemo(
    () => activeL1?.children.find((l2) => l2.id === activeL2Id) ?? null,
    [activeL1, activeL2Id],
  );

  // ── option lists ─────────────────────────────────────────────────────────────

  const l1Options = useMemo<CategoryPickerOption[]>(
    () =>
      sortedGroups.flatMap((group) =>
        group.children.map((l1) => ({
          id: l1.id,
          label: l1.name,
          parentLabel: group.name,
          icon: l1.icon,
          color: l1.color,
        })),
      ),
    [sortedGroups],
  );

  const l2Options = useMemo<CategoryPickerOption[]>(
    () =>
      (activeL1?.children ?? []).map((l2) => ({
        id: l2.id,
        label: l2.name,
        color: l2.color,
        icon: l2.icon,
      })),
    [activeL1],
  );

  const l3Options = useMemo<CategoryPickerOption[]>(
    () =>
      (activeL2?.children ?? []).map((l3) => ({
        id: l3.id,
        label: l3.name,
        color: l3.color,
        icon: l3.icon,
      })),
    [activeL2],
  );

  // ── visibility ───────────────────────────────────────────────────────────────

  const showCol2 = activeL1 !== null && !activeL1.isLeaf;
  const showCol3 =
    activeL2 !== null && (onCreateL3 !== undefined || (activeL2.children.length ?? 0) > 0);

  // ── derived column values ─────────────────────────────────────────────────────

  // col2 always tracks the committed L2 even when L3 is further selected
  const col2Value = activeL2Id;

  // col3 only set when outer value is an L3 descendant of the active L2
  const col3Value =
    activeL2 && value && activeL2.children.some((l3) => l3.id === value) ? value : null;

  // ── error routing ─────────────────────────────────────────────────────────────

  const col1Error = error && !activeL1 ? error : undefined;
  const col2Error = error && activeL1 && showCol2 && !activeL2Id ? error : undefined;

  // ── handlers ──────────────────────────────────────────────────────────────────

  function handleL1Change(id: string | null) {
    if (!id) {
      setActiveL1Id(null);
      setActiveL2Id(null);
      onChange(null);
      return;
    }
    const l1 = allL1s.find((n) => n.id === id);
    if (!l1) return;
    setActiveL1Id(id);
    setActiveL2Id(null);
    if (l1.isLeaf) {
      onChange(id);
    } else {
      // Non-leaf: reveal col 2, don't commit yet
      onChange(null);
    }
  }

  function handleL2Change(id: string | null) {
    if (!id) {
      setActiveL2Id(null);
      onChange(null);
      return;
    }
    setActiveL2Id(id);
    // Commit L2 immediately; L3 is an optional refinement
    onChange(id);
  }

  function handleL3Change(id: string | null) {
    if (!id) {
      // L3 cleared → revert to the committed L2
      onChange(activeL2Id);
      return;
    }
    onChange(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="casc-cat">
      {label && <span className="casc-cat__label">{label}</span>}

      {/* Universal search — find any category by name without knowing its level */}
      <div className="casc-cat__search-wrap" ref={searchRef}>
        <div className="casc-cat__search-input-row">
          <Search size={14} className="casc-cat__search-icon" aria-hidden />
          <input
            ref={searchInputRef}
            type="text"
            className="casc-cat__search-input"
            placeholder="Search any category or item…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery) setSearchOpen(true);
            }}
            aria-label="Search categories"
            aria-expanded={searchOpen && searchResults.length > 0}
            aria-autocomplete="list"
          />
          {searchQuery && (
            <button
              type="button"
              className="casc-cat__search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
        {searchOpen &&
          dropdownPos &&
          searchQuery.length > 0 &&
          createPortal(
            searchResults.length > 0 ? (
              <div
                role="listbox"
                tabIndex={0}
                className="casc-cat__search-dropdown"
                style={{
                  position: 'fixed',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  maxHeight: dropdownPos.maxHeight,
                }}
              >
                {searchResults.map((r) => (
                  <div
                    role="option"
                    key={r.id}
                    tabIndex={-1}
                    aria-selected={r.id === value}
                    className={[
                      'casc-cat__search-item',
                      r.id === value && 'casc-cat__search-item--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSearchSelect(r);
                    }}
                  >
                    <span className="casc-cat__search-item-label">{r.label}</span>
                    <span className="casc-cat__search-item-breadcrumb">{r.breadcrumb}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="casc-cat__search-empty"
                style={{
                  position: 'fixed',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                }}
              >
                No categories match &quot;{searchQuery}&quot;
              </div>
            ),
            document.body,
          )}
      </div>

      <div className="casc-cat__cols">
        {/* Column 1 — Main Category */}
        <div className="casc-cat__col">
          <span className="casc-cat__col-heading">MAIN CATEGORY</span>
          <CategoryPicker
            options={l1Options}
            value={activeL1Id}
            onChange={handleL1Change}
            placeholder="Select category…"
            error={col1Error}
            loading={loading}
            onCreate={onCreateL1}
            priorityParentLabel={sortedGroups[0]?.name}
          />
        </div>

        {/* Column 2 — Sub-category */}
        {showCol2 && (
          <>
            <span className="casc-cat__sep" aria-hidden>
              ›
            </span>
            <div className="casc-cat__col">
              <span className="casc-cat__col-heading">SUB-CATEGORY</span>
              <CategoryPicker
                options={l2Options}
                value={col2Value}
                onChange={handleL2Change}
                placeholder="Select subcategory…"
                error={col2Error}
                onCreate={
                  onCreateL2 && activeL1Id ? (name) => onCreateL2(name, activeL1Id) : undefined
                }
              />
            </div>
          </>
        )}

        {/* Column 3 — Specific Item (optional) */}
        {showCol3 && (
          <>
            <span className="casc-cat__sep" aria-hidden>
              ›
            </span>
            <div className="casc-cat__col">
              <span className="casc-cat__col-heading">
                SPECIFIC ITEM
                <span className="casc-cat__col-optional"> optional</span>
              </span>
              <CategoryPicker
                options={l3Options}
                value={col3Value}
                onChange={handleL3Change}
                placeholder="Add specific item…"
                onCreate={
                  onCreateL3 && activeL2Id ? (name) => onCreateL3(name, activeL2Id) : undefined
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
