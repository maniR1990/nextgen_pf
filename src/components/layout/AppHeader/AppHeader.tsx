'use client';

import { useScrollCollapse } from '@/hooks/useScrollCollapse';
import type { AppHeaderConfig, AppHeaderData, ContextSubBarItem } from '@/lib/schemas/appHeader';
import { usePathname } from 'next/navigation';
import { Suspense, useLayoutEffect, useRef } from 'react';
import { ContextSubBar } from './ContextSubBar';
import { MainNav } from './MainNav';
import { PulseStrip } from './PulseStrip';
import { SettingsFilterBar } from './SettingsFilterBar';
import { TransactionFilterBar } from './TransactionFilterBar';

export interface AppHeaderProps {
  config: AppHeaderConfig;
  data: AppHeaderData;
  onLogTransaction: () => void;
  onSearch: () => void;
}

function getSubBarItems(
  screens: AppHeaderConfig['contextSubBar']['screens'],
  pathname: string,
): ContextSubBarItem[] {
  if (screens[pathname]) return screens[pathname];
  // Prefix match for nested routes
  const match = Object.keys(screens).find(
    (key) => key !== '/dashboard' && pathname.startsWith(key),
  );
  return match ? screens[match] : [];
}

export function AppHeader({ config, data, onLogTransaction, onSearch }: AppHeaderProps) {
  const pathname = usePathname();
  const collapsed = useScrollCollapse(config.pulseStrip.collapseAfterScrollPx);
  const headerRef = useRef<HTMLElement>(null);

  // Set --app-header-height only when expanded so padding-top never shrinks on scroll.
  // pathname dependency ensures it re-measures when subbars change between pages.
  // biome-ignore lint/correctness/useExhaustiveDependencies: headerRef is stable; pathname triggers re-measure on page change
  useLayoutEffect(() => {
    if (collapsed) return;
    const el = headerRef.current;
    if (!el) return;
    document.documentElement.style.setProperty('--app-header-height', `${el.offsetHeight}px`);
  }, [collapsed, pathname]);

  const subBarItems = getSubBarItems(config.contextSubBar.screens, pathname);
  const isTransactionsScreen = pathname.startsWith('/dashboard/transactions');
  const isSettingsScreen = pathname.startsWith('/dashboard/settings');
  const { pulseStrip } = config;

  return (
    <header ref={headerRef} className="app-header">
      <PulseStrip
        metrics={pulseStrip.metrics}
        marketSymbols={pulseStrip.marketTicker.symbols}
        marketLabels={pulseStrip.marketTicker.labels}
        data={data}
        collapsed={collapsed}
      />

      <MainNav
        brand={config.brand}
        items={config.nav}
        userInitials={data.userInitials}
        onSearch={onSearch}
        onLogTransaction={onLogTransaction}
      />

      {isTransactionsScreen ? (
        <Suspense fallback={null}>
          <TransactionFilterBar />
        </Suspense>
      ) : isSettingsScreen ? (
        <Suspense fallback={null}>
          <SettingsFilterBar />
        </Suspense>
      ) : (
        // Reports supplies its own sticky title + filter bar inline in the page body
        // (see BudgetReportFilterBar) — a second one here would be exactly the
        // duplicate date/filter control this header used to have.
        <ContextSubBar items={subBarItems} data={data} />
      )}
    </header>
  );
}
