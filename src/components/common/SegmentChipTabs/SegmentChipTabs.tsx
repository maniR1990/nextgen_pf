'use client';

import type { HTMLAttributes } from 'react';

export interface SegmentChipTabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentChipTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: SegmentChipTabItem[];
  value: string;
  onChange: (id: string) => void;
  'aria-label'?: string;
}

export function SegmentChipTabs({
  items,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Sections',
  ...props
}: SegmentChipTabsProps) {
  return (
    <div
      className={['segment-chip-tabs', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
      {...props}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            className={[
              'segment-chip-tabs__chip',
              active && 'segment-chip-tabs__chip--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
