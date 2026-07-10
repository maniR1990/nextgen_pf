'use client';

import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import type { CascadingCategoryPickerProps } from '@/components/common/CascadingCategoryPicker';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function findCategoryLabel(groups: PickerGroup[], id: string): string | null {
  for (const group of groups) {
    for (const l1 of group.children) {
      if (l1.id === id) return l1.name;
      for (const l2 of l1.children) {
        if (l2.id === id) return l2.name;
        for (const l3 of l2.children) {
          if (l3.id === id) return l3.name;
        }
      }
    }
  }
  return null;
}

/**
 * Shows the full CascadingCategoryPicker until a category is chosen, then
 * collapses to a compact confirmed chip — tap the chip to reopen the picker
 * and change it. Same picker, same behavior, just not taking up space once
 * a decision has already been made.
 */
export function CollapsibleCategoryPicker(props: CascadingCategoryPickerProps) {
  const { value, groups, onChange } = props;
  const [isEditing, setIsEditing] = useState(false);
  const selectedLabel = value ? findCategoryLabel(groups, value) : null;

  if (selectedLabel && !isEditing) {
    return (
      <button
        type="button"
        className="collapsible-category-picker__chip"
        onClick={() => setIsEditing(true)}
      >
        <Check size={13} aria-hidden />
        <span>{selectedLabel}</span>
        <ChevronDown size={12} aria-hidden />
      </button>
    );
  }

  return (
    <CascadingCategoryPicker
      {...props}
      onChange={(id) => {
        onChange(id);
        if (id) setIsEditing(false);
      }}
    />
  );
}
