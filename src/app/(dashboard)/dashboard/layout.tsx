'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { SessionExpiredModal } from '@/components/common/SessionExpiredModal';
import { useAppHeaderData } from '@/hooks/useAppHeaderData';
import { AppHeaderConfigSchema } from '@/lib/schemas/appHeader';
import { AppFooterConfigSchema } from '@/lib/schemas/appFooter';
import rawHeaderConfig from '@/config/appHeader.json';
import rawFooterConfig from '@/config/appFooter.json';

const headerConfig = AppHeaderConfigSchema.parse(rawHeaderConfig);
const footerConfig = AppFooterConfigSchema.parse(rawFooterConfig);

const FALLBACK_DATA = {
  netWorth: 0, netWorthChangePct: 0,
  readyToAssign: 0, budgetPeriodLabel: '—',
  monthSpend: 0, spendPaceLabel: '—',
  daysUntilClose: 0, closeDateLabel: '—',
  market: {},
  pendingCount: 0, spendPace: 0, spendPaceChangePct: 0,
  unallocated: 0, nextRecurringLabel: '—', monthClosesLabel: '—',
  userInitials: '..', notificationCount: 0,
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = useAppHeaderData();
  const [txOpen, setTxOpen] = useState(false);
  const liveData = data ?? FALLBACK_DATA;

  return (
    <div className="shell shell--top-nav">
      <AppHeader
        config={headerConfig}
        data={liveData}
        onLogTransaction={() => setTxOpen(true)}
        onSearch={() => { /* TODO: open command palette */ }}
      />

      <main className="shell__main shell__main--top-nav">
        {children}
      </main>

      <AppFooter
        config={footerConfig}
        data={liveData}
        onLogTransaction={() => setTxOpen(true)}
        onCommandPalette={() => { /* TODO: open command palette */ }}
      />

      <BottomTabBar
        config={headerConfig.mobile}
        onFabAction={() => setTxOpen(true)}
      />

      <TransactionDialog
        open={txOpen}
        onClose={() => setTxOpen(false)}
      />

      <SessionExpiredModal />
    </div>
  );
}
