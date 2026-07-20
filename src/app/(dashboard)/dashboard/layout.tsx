'use client';

import { NavigationProgress } from '@/components/common/NavigationProgress';
import { SessionExpiredModal } from '@/components/common/SessionExpiredModal';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { AppFooter } from '@/components/layout/AppFooter';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import rawFooterConfig from '@/config/appFooter.json';
import rawHeaderConfig from '@/config/appHeader.json';
import { useAppHeaderData } from '@/hooks/useAppHeaderData';
import { AppFooterConfigSchema } from '@/lib/schemas/appFooter';
import { AppHeaderConfigSchema } from '@/lib/schemas/appHeader';
import type { TxType } from '@/constants/finance';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const headerConfig = AppHeaderConfigSchema.parse(rawHeaderConfig);
const footerConfig = AppFooterConfigSchema.parse(rawFooterConfig);

// Handles the home-screen "Log expense"/"Log bill" shortcuts (see src/app/manifest.ts),
// which land here as ?quickAction=log[&mode=bulk]. useSearchParams() needs its own
// Suspense boundary or Next bails the whole layout out of static rendering.
function QuickActionHandler({ onQuickLog }: { onQuickLog: (bulk: boolean) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('quickAction') !== 'log') return;
    onQuickLog(searchParams.get('mode') === 'bulk');
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router, onQuickLog]);

  return null;
}

const FALLBACK_DATA = {
  netWorth: 0,
  netWorthChangePct: 0,
  readyToAssign: 0,
  budgetPeriodLabel: '—',
  monthSpend: 0,
  spendPaceLabel: '—',
  daysUntilClose: 0,
  closeDateLabel: '—',
  market: {},
  pendingCount: 0,
  spendPace: 0,
  spendPaceChangePct: 0,
  unallocated: 0,
  nextRecurringLabel: '—',
  monthClosesLabel: '—',
  userInitials: '..',
  notificationCount: 0,
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = useAppHeaderData();
  const [txOpen, setTxOpen] = useState(false);
  const [fabTxType, setFabTxType] = useState<TxType>('EXPENSE');
  const [quickBulk, setQuickBulk] = useState(false);
  const liveData = data ?? FALLBACK_DATA;

  return (
    <div className="shell shell--top-nav">
      <AppHeader
        config={headerConfig}
        data={liveData}
        onLogTransaction={() => setTxOpen(true)}
        onSearch={() => {
          /* TODO: open command palette */
        }}
      />

      <main className="shell__main shell__main--top-nav">{children}</main>

      <AppFooter
        config={footerConfig}
        metrics={headerConfig.pulseStrip.metrics}
        collapseAfterScrollPx={headerConfig.pulseStrip.collapseAfterScrollPx}
        data={liveData}
        onLogTransaction={() => setTxOpen(true)}
        onCommandPalette={() => {
          /* TODO: open command palette */
        }}
      />

      <BottomTabBar
        config={headerConfig.mobile}
        onFabAction={(type) => {
          setFabTxType(type as TxType);
          setTxOpen(true);
        }}
      />

      <TransactionDialog
        open={txOpen}
        onClose={() => {
          setTxOpen(false);
          setFabTxType('EXPENSE');
          setQuickBulk(false);
        }}
        prefillValues={{ type: fabTxType }}
        initialMultiItem={quickBulk}
      />

      <Suspense>
        <QuickActionHandler
          onQuickLog={(bulk) => {
            setFabTxType('EXPENSE');
            setQuickBulk(bulk);
            setTxOpen(true);
          }}
        />
        <NavigationProgress />
      </Suspense>
      <SessionExpiredModal />
    </div>
  );
}
