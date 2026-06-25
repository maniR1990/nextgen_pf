'use client';

import { Icon } from '@/components/ui/Icon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';
import { SideMenuFooter } from './SideMenuFooter';
import { resolveSideMenuIcon } from './resolveSideMenuIcon';
import type { SideMenuConfigJson, SideMenuItemJson } from './schemas';

export type SideMenuVariant = 'shell' | 'standalone';

export interface SideMenuProps {
  config: SideMenuConfigJson;
  activeId?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onItemSelect?: (item: SideMenuItemJson) => void;
  variant?: SideMenuVariant;
  className?: string;
  'aria-label'?: string;
}

export function sideMenuClassName({
  collapsed = false,
  variant = 'shell',
  className = '',
}: {
  collapsed?: boolean;
  variant?: SideMenuVariant;
  className?: string;
}) {
  return ['side-menu', `side-menu--${variant}`, collapsed && 'side-menu--collapsed', className]
    .filter(Boolean)
    .join(' ');
}

function isItemActive(pathname: string, item: SideMenuItemJson, activeId?: string) {
  if (activeId) return item.id === activeId;
  if (pathname === item.href) return true;
  if (item.href === '/dashboard') return false;
  return pathname.startsWith(`${item.href}/`);
}

export function SideMenu({
  config,
  activeId,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  onItemSelect,
  variant = 'shell',
  className = '',
  'aria-label': ariaLabel = 'Main navigation',
}: SideMenuProps) {
  const pathname = usePathname();
  const navId = useId();
  const [collapsedInternal, setCollapsedInternal] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? collapsedInternal;

  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) setCollapsedInternal(next);
    onCollapsedChange?.(next);
  };

  return (
    <aside className={sideMenuClassName({ collapsed, variant, className })}>
      <header className="side-menu__header">
        <Link
          href={config.brand.homeHref as Route}
          className="side-menu__brand"
          aria-label={config.brand.appName}
        >
          <span className="side-menu__logo" aria-hidden>
            <Icon icon={resolveSideMenuIcon(config.brand.logoIcon)} size="sm" tone="inherit" />
          </span>
          <span className="side-menu__app-name">{config.brand.appName}</span>
        </Link>
        <button
          type="button"
          className="side-menu__collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls={navId}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon icon={collapsed ? ChevronRight : ChevronLeft} size="sm" tone="muted" aria-hidden />
        </button>
      </header>

      <div className="side-menu__divider" role="separator" />

      <nav id={navId} className="side-menu__nav" aria-label={ariaLabel}>
        <ul className="side-menu__list">
          {config.items.map((item) => {
            const active = isItemActive(pathname, item, activeId);
            const linkClass = ['side-menu__link', active && 'side-menu__link--active']
              .filter(Boolean)
              .join(' ');

            return (
              <li key={item.id} className="side-menu__item">
                <Link
                  href={item.href as Route}
                  className={linkClass}
                  aria-current={active ? 'page' : undefined}
                  aria-disabled={item.disabled || undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    onItemSelect?.(item);
                  }}
                >
                  <span className="side-menu__icon" aria-hidden>
                    <Icon icon={resolveSideMenuIcon(item.icon)} size="md" tone="inherit" />
                  </span>
                  <span className="side-menu__label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {config.footer ? <SideMenuFooter footer={config.footer} collapsed={collapsed} /> : null}
    </aside>
  );
}
