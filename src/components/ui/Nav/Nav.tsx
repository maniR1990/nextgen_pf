'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export type NavOrientation = 'vertical' | 'horizontal';

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  disabled?: boolean;
}

export interface NavProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: NavItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  orientation?: NavOrientation;
  'aria-label'?: string;
}

const ORIENTATION_CLASS: Record<NavOrientation, string> = {
  vertical: 'nav--vertical',
  horizontal: 'nav--horizontal',
};

export function navClassName({
  orientation = 'vertical',
  className = '',
}: {
  orientation?: NavOrientation;
  className?: string;
}) {
  return ['nav', ORIENTATION_CLASS[orientation], className].filter(Boolean).join(' ');
}

function NavLink({
  item,
  isActive,
  onSelect,
}: {
  item: NavItem;
  isActive: boolean;
  onSelect?: (id: string) => void;
}) {
  const className = ['nav__link', isActive && 'nav__link--active'].filter(Boolean).join(' ');
  const content = (
    <>
      {item.icon && <span className="nav__icon">{item.icon}</span>}
      <span className="nav__label">{item.label}</span>
    </>
  );

  if (item.href && !item.disabled) {
    return (
      <a
        href={item.href}
        className={className}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => {
          if (!onSelect) return;
          event.preventDefault();
          onSelect(item.id);
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={item.disabled}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onSelect?.(item.id)}
    >
      {content}
    </button>
  );
}

export function Nav({
  items,
  activeId,
  onSelect,
  orientation = 'vertical',
  className = '',
  'aria-label': ariaLabel = 'Navigation',
  ...props
}: NavProps) {
  return (
    <nav aria-label={ariaLabel} {...props}>
      <ul className={navClassName({ orientation, className })}>
        {items.map((item) => (
          <li key={item.id} className="nav__item">
            <NavLink item={item} isActive={item.id === activeId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
