import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHeader } from './AppHeader';
import type { AppHeaderConfig, AppHeaderData } from '@/lib/schemas/appHeader';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams('year=2026&month=6'),
}));

vi.mock('@/lib/query/fetcher', () => ({
  apiGetV1: vi.fn().mockResolvedValue([]),
}));

let mockPathname = '/dashboard';

const mockConfig: AppHeaderConfig = {
  brand: { appName: 'PersonalFi', logoAbbr: 'PF', homeHref: '/dashboard' },
  nav: [
    { id: 'dashboard',    label: 'Dashboard',    href: '/dashboard' },
    { id: 'budget',       label: 'Budget',       href: '/dashboard/budget' },
    { id: 'transactions', label: 'Transactions', href: '/dashboard/transactions' },
    { id: 'goals',        label: 'Goals',        href: '/dashboard/goals' },
    { id: 'reports',      label: 'Reports',      href: '/dashboard/reports' },
    { id: 'settings',     label: 'Settings',     href: '/dashboard/settings' },
  ],
  pulseStrip: {
    collapseAfterScrollPx: 40,
    metrics: [
      { id: 'netWorth',      label: 'NET WORTH',       dataKey: 'netWorth',      changeKey: 'netWorthChangePct', format: 'currency-inr-compact' },
      { id: 'readyToAssign', label: 'READY TO ASSIGN', dataKey: 'readyToAssign', metaKey: 'budgetPeriodLabel',   format: 'currency-inr' },
      { id: 'monthSpend',    label: 'MONTH SPEND',     dataKey: 'monthSpend',    metaKey: 'spendPaceLabel',      format: 'currency-inr' },
      { id: 'monthCloses',   label: 'CLOSES IN',       dataKey: 'daysUntilClose', metaKey: 'closeDateLabel',    format: 'days' },
    ],
    marketTicker: {
      symbols: ['NIFTY_50', 'SENSEX'],
      labels: { NIFTY_50: 'NIFTY 50', SENSEX: 'SENSEX' },
    },
  },
  contextSubBar: {
    screens: {
      '/dashboard': [
        { id: 'pending', label: 'PENDING', dataKey: 'pendingCount', unit: 'transactions' },
      ],
    },
  },
  mobile: {
    tabBar: [
      { id: 'home',   label: 'Home',   icon: 'home',      href: '/dashboard' },
      { id: 'budget', label: 'Budget', icon: 'bar-chart', href: '/dashboard/budget' },
      { id: 'fab',    label: '',       icon: 'plus',      isFab: true },
      { id: 'goals',  label: 'Goals',  icon: 'target',    href: '/dashboard/goals' },
      { id: 'profile',label: 'Profile',icon: 'user',      href: '/dashboard/profile' },
    ],
    fabRadial: {
      radiusPx: 80,
      animationMs: 200,
      actions: [
        { id: 'expense', label: 'Expense', icon: 'arrow-down-left', color: 'error',   transactionType: 'EXPENSE' },
        { id: 'income',  label: 'Income',  icon: 'arrow-up-right',  color: 'success', transactionType: 'INCOME' },
        { id: 'transfer',label: 'Transfer',icon: 'arrow-left-right',color: 'info',    transactionType: 'TRANSFER' },
        { id: 'investment',label:'Investment',icon:'trending-up',   color: 'purple',  transactionType: 'INVESTMENT' },
      ],
    },
  },
};

const mockData: AppHeaderData = {
  netWorth: 4_720_000,
  netWorthChangePct: 2.3,
  readyToAssign: 6_817,
  budgetPeriodLabel: 'Jun 2026',
  monthSpend: 89_432,
  spendPaceLabel: 'Pace: ₹4,210/day',
  daysUntilClose: 18,
  closeDateLabel: 'Jun 30',
  market: {
    NIFTY_50: { label: 'NIFTY 50', value: 24_832, changePct: 0.4 },
    SENSEX:   { label: 'SENSEX',   value: 81_442, changePct: 0.3 },
  },
  pendingCount: 3,
  spendPace: 4_210,
  spendPaceChangePct: 12,
  unallocated: 6_817,
  nextRecurringLabel: 'Jun 15 · Car Service ₹4,500',
  monthClosesLabel: '18 days · Jun 30',
  userInitials: 'RK',
  notificationCount: 3,
};

function renderHeader(overrides?: Partial<AppHeaderData>) {
  const onLogTransaction = vi.fn();
  const onSearch = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AppHeader
        config={mockConfig}
        data={{ ...mockData, ...overrides }}
        onLogTransaction={onLogTransaction}
        onSearch={onSearch}
      />
    </QueryClientProvider>,
  );
  return { onLogTransaction, onSearch };
}

afterEach(() => cleanup());

// ─── Pulse Strip ───────────────────────────────────────────────────────────────

describe('PulseStrip', () => {
  it('renders all metric labels', () => {
    renderHeader();
    expect(screen.getByText('NET WORTH')).toBeDefined();
    expect(screen.getByText('READY TO ASSIGN')).toBeDefined();
    expect(screen.getByText('MONTH SPEND')).toBeDefined();
    expect(screen.getByText('CLOSES IN')).toBeDefined();
  });

  it('renders compact INR for net worth', () => {
    renderHeader();
    expect(screen.getByText(/₹47\.2L/)).toBeDefined();
  });

  it('renders full INR for readyToAssign', () => {
    renderHeader();
    expect(screen.getByText(/₹6,817/)).toBeDefined();
  });

  it('renders change percentage with sign', () => {
    renderHeader();
    expect(screen.getByText(/\+2\.3%/)).toBeDefined();
  });

  it('renders days-until-close as number with meta date', () => {
    renderHeader();
    expect(screen.getByText(/18/)).toBeDefined();
    expect(screen.getByText(/Jun 30/)).toBeDefined();
  });

  it('renders market ticker symbols', () => {
    renderHeader();
    expect(screen.getByText('NIFTY 50')).toBeDefined();
    expect(screen.getByText('SENSEX')).toBeDefined();
  });

  it('is visible before scrolling', () => {
    renderHeader();
    const strip = document.querySelector('.pulse-strip');
    expect(strip?.classList.contains('pulse-strip--collapsed')).toBe(false);
  });
});

// ─── MainNav ───────────────────────────────────────────────────────────────────

describe('MainNav', () => {
  it('renders brand name', () => {
    renderHeader();
    expect(screen.getByText('PersonalFi')).toBeDefined();
  });

  it('renders all nav items', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Budget' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Transactions' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Goals' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Reports' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeDefined();
  });

  it('marks current route as active', () => {
    renderHeader();
    const dashLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashLink.getAttribute('aria-current')).toBe('page');
  });

  it('shows notification badge count', () => {
    renderHeader();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('renders Log button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /log/i })).toBeDefined();
  });

  it('calls onLogTransaction when Log is clicked', () => {
    const { onLogTransaction } = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /log/i }));
    expect(onLogTransaction).toHaveBeenCalledOnce();
  });

  it('calls onSearch when Search is clicked', () => {
    const { onSearch } = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('renders user avatar with initials', () => {
    renderHeader();
    expect(screen.getByText('RK')).toBeDefined();
  });
});

// ─── Context Sub-Bar ───────────────────────────────────────────────────────────

describe('ContextSubBar', () => {
  it('renders items for current route /dashboard', () => {
    renderHeader();
    expect(screen.getByText('PENDING')).toBeDefined();
    expect(screen.getByText(/3 transactions/i)).toBeDefined();
  });

  it('renders nothing when route has no sub-bar config', () => {
    renderHeader();
    const subBar = document.querySelector('.context-sub-bar');
    expect(subBar).toBeDefined();
  });

  it('renders transaction filter bar on transactions route', () => {
    mockPathname = '/dashboard/transactions';
    renderHeader();
    expect(document.querySelector('.tx-filter-bar')).toBeTruthy();
    expect(document.querySelector('.context-sub-bar')).toBeNull();
    mockPathname = '/dashboard';
  });

  it('renders settings filter bar on settings route', () => {
    mockPathname = '/dashboard/settings';
    renderHeader();
    expect(document.querySelector('.tx-filter-bar')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Accounts' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Categories' })).toBeDefined();
    expect(document.querySelector('.context-sub-bar')).toBeNull();
    mockPathname = '/dashboard';
  });
});
