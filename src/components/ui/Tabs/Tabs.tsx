'use client';

import type { HTMLAttributes } from 'react';

export type TabsSize = 'sm' | 'md';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  size?: TabsSize;
  'aria-label'?: string;
}

const SIZE_CLASS: Record<TabsSize, string> = {
  sm: 'tabs--sm',
  md: 'tabs--md',
};

export function tabsClassName({
  size = 'md',
  className = '',
}: {
  size?: TabsSize;
  className?: string;
}) {
  return ['tabs', SIZE_CLASS[size], className].filter(Boolean).join(' ');
}

export function Tabs({
  items,
  value,
  onChange,
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Tabs',
  ...props
}: TabsProps) {
  return (
    <div
      className={tabsClassName({ size, className })}
      role="tablist"
      aria-label={ariaLabel}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={['tabs__tab', isActive && 'tabs__tab--active'].filter(Boolean).join(' ')}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
