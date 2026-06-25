'use client';

import { CategoryPicker } from '@/components/common/CategoryPicker';
import type { CategoryPickerOption } from '@/components/common/CategoryPicker';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useEffect, useMemo, useState } from 'react';

export interface CascadingCategoryPickerProps {
  groups: PickerGroup[];
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  error?: string;
  loading?: boolean;
  /** Creates a new sub-category under the currently selected main category. Returns the new id. */
  onCreateL2?: (name: string, parentId: string) => Promise<string>;
}

function findL1ForValue(groups: PickerGroup[], id: string | null) {
  if (!id) return null;
  for (const group of groups) {
    for (const l1 of group.children) {
      if (l1.id === id) return l1;
      if (l1.children.some((l2) => l2.id === id)) return l1;
    }
  }
  return null;
}

export function CascadingCategoryPicker({
  groups,
  value,
  onChange,
  label,
  error,
  loading,
  onCreateL2,
}: CascadingCategoryPickerProps) {
  const allL1s = useMemo(() => groups.flatMap((g) => g.children), [groups]);

  // activeL1Id drives which column 2 is shown — may lead `value` when a non-leaf L1 is
  // selected but no L2 has been picked yet.
  const [activeL1Id, setActiveL1Id] = useState<string | null>(
    () => findL1ForValue(groups, value)?.id ?? null,
  );

  // Keep in sync when value changes externally (e.g. form reset)
  useEffect(() => {
    const l1 = findL1ForValue(groups, value);
    setActiveL1Id(l1?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const activeL1 = useMemo(
    () => allL1s.find((l1) => l1.id === activeL1Id) ?? null,
    [allL1s, activeL1Id],
  );

  const l1Options = useMemo<CategoryPickerOption[]>(
    () =>
      groups.flatMap((group) =>
        group.children.map((l1) => ({
          id: l1.id,
          label: l1.name,
          parentLabel: group.name,
          icon: l1.icon,
          color: l1.color,
        })),
      ),
    [groups],
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

  const showCol2 = activeL1 !== null && !activeL1.isLeaf;

  // Column 2 value: only when the outer value belongs to activeL1's children
  const col2Value =
    activeL1 && value && activeL1.children.some((l2) => l2.id === value) ? value : null;

  const col1Error = error && !activeL1 ? error : undefined;
  const col2Error = error && activeL1 && showCol2 && !col2Value ? error : undefined;

  function handleL1Change(id: string | null) {
    if (!id) {
      setActiveL1Id(null);
      onChange(null);
      return;
    }
    const l1 = allL1s.find((n) => n.id === id);
    if (!l1) return;
    setActiveL1Id(id);
    if (l1.isLeaf) {
      onChange(id);
    } else {
      // Non-leaf: reveal col 2, don't commit a value yet
      onChange(null);
    }
  }

  return (
    <div className="casc-cat">
      {label && <span className="casc-cat__label">{label}</span>}

      <div className="casc-cat__cols">
        <div className="casc-cat__col">
          <span className="casc-cat__col-heading">MAIN CATEGORY</span>
          <CategoryPicker
            options={l1Options}
            value={activeL1Id}
            onChange={handleL1Change}
            placeholder="Select category…"
            error={col1Error}
            loading={loading}
          />
        </div>

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
                onChange={onChange}
                placeholder="Select subcategory…"
                error={col2Error}
                onCreate={
                  onCreateL2 && activeL1Id ? (name) => onCreateL2(name, activeL1Id) : undefined
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
