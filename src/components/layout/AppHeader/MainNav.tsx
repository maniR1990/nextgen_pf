'use client';

import type { AppHeaderConfig, AppHeaderNavItem } from '@/lib/schemas/appHeader';
import { LogOut, Plus, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface MainNavProps {
  brand: AppHeaderConfig['brand'];
  items: AppHeaderNavItem[];
  userInitials: string;
  onSearch: () => void;
  onLogTransaction: () => void;
}

export function MainNav({ brand, items, userInitials, onSearch, onLogTransaction }: MainNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function handleLogout() {
    setIsLoggingOut(true);
    setMenuOpen(false);
    // keepalive ensures the request completes even after page unloads.
    // Cookies are cleared by the response Set-Cookie headers in the background.
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(
      () => {},
    );
    // Navigate immediately — don't wait for the DB write.
    window.location.replace('/login');
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <div className="main-nav">
      <div className="main-nav__inner">
        {/* Brand */}
        <Link href={brand.homeHref} className="main-nav__brand" aria-label={brand.appName}>
          <span className="main-nav__logo" aria-hidden="true">
            {brand.logoAbbr}
          </span>
          <span className="main-nav__app-name">{brand.appName}</span>
        </Link>

        {/* Primary navigation */}
        <nav aria-label="Primary navigation" className="main-nav__tabs-wrap">
          <ul className="main-nav__tabs">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.id} className="main-nav__tab-item">
                  <Link
                    href={item.href}
                    className={['main-nav__tab-link', active && 'main-nav__tab-link--active']
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right-side actions */}
        <div className="main-nav__actions">
          <button
            type="button"
            className="main-nav__search-btn"
            onClick={onSearch}
            aria-label="Search"
          >
            <Search size={15} aria-hidden />
            <span className="main-nav__search-label">Search</span>
            <kbd className="main-nav__kbd">⌘K</kbd>
          </button>

          <button
            type="button"
            className="main-nav__log-btn"
            onClick={onLogTransaction}
            aria-label="Log transaction"
          >
            <Plus size={15} aria-hidden />
            Log
          </button>

          <div className="main-nav__avatar-wrap" ref={menuRef}>
            <button
              type="button"
              className={`main-nav__avatar${menuOpen ? ' main-nav__avatar--open' : ''}`}
              aria-label="Profile menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {userInitials}
            </button>

            {menuOpen && (
              <div className="main-nav__user-menu" role="menu">
                <div className="main-nav__user-menu-header">
                  <div className="main-nav__user-avatar-lg">{userInitials}</div>
                  <span className="main-nav__user-initials-label">My Account</span>
                </div>
                <hr className="main-nav__user-menu-divider" />
                <button
                  type="button"
                  className="main-nav__user-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                >
                  <User size={14} aria-hidden />
                  Profile
                </button>
                <button
                  type="button"
                  className="main-nav__user-menu-item main-nav__user-menu-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                >
                  <LogOut size={14} aria-hidden />
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
