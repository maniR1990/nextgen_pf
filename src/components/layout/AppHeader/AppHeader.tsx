'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PulseStrip } from './PulseStrip';
import { MainNav } from './MainNav';
import { ContextSubBar } from './ContextSubBar';
import { TransactionFilterBar } from './TransactionFilterBar';
import { SettingsFilterBar } from './SettingsFilterBar';
import { ReportFilterBar } from './ReportFilterBar';
import type { AppHeaderConfig, AppHeaderData, ContextSubBarItem } from '@/lib/schemas/appHeader';

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
  const [collapsed, setCollapsed] = useState(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const threshold = config.pulseStrip.collapseAfterScrollPx;

    function onScroll() {
      const y = window.scrollY;
      setCollapsed(y > threshold);
      prevScrollY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [config.pulseStrip.collapseAfterScrollPx]);

  const subBarItems = getSubBarItems(config.contextSubBar.screens, pathname);
  const isTransactionsScreen = pathname.startsWith('/dashboard/transactions');
  const isSettingsScreen = pathname.startsWith('/dashboard/settings');
  const isReportsScreen = pathname.startsWith('/dashboard/reports');
  const { pulseStrip } = config;

  return (
    <header className="app-header" role="banner">
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
        notificationCount={data.notificationCount}
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
      ) : isReportsScreen ? (
        <Suspense fallback={null}>
          <ReportFilterBar />
        </Suspense>
      ) : (
        <ContextSubBar items={subBarItems} data={data} />
      )}
    </header>
  );
}
