import type { AppFooterConfig } from '@/lib/schemas/appFooter';
import type { AppHeaderData, PulseMetric } from '@/lib/schemas/appHeader';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppFooter } from './AppFooter';

const mockConfig: AppFooterConfig = {
  shortcuts: [
    { id: 'commandPalette', label: 'Command palette', key: '⌘K', action: 'commandPalette' },
    { id: 'logTransaction', label: 'Log transaction', key: 'N', action: 'logTransaction' },
  ],
};

const mockMetrics: PulseMetric[] = [
  {
    id: 'readyToAssign',
    label: 'READY TO ASSIGN',
    dataKey: 'readyToAssign',
    metaKey: 'budgetPeriodLabel',
    format: 'currency-inr',
    alertWhenZero: true,
  },
  {
    id: 'monthSpend',
    label: 'MONTH SPEND',
    dataKey: 'monthSpend',
    metaKey: 'spendPaceLabel',
    format: 'currency-inr',
  },
  {
    id: 'monthCloses',
    label: 'CLOSES IN',
    dataKey: 'daysUntilClose',
    metaKey: 'closeDateLabel',
    format: 'days',
  },
];

const mockData: AppHeaderData = {
  netWorth: 4_720_000,
  netWorthChangePct: 2.3,
  readyToAssign: 6_817,
  budgetPeriodLabel: 'Jun 2026',
  monthSpend: 89_432,
  spendPaceLabel: 'Pace: ₹4,210/day',
  daysUntilClose: 18,
  closeDateLabel: 'Jun 30',
  market: {},
  pendingCount: 3,
  spendPace: 4_210,
  spendPaceChangePct: 12,
  unallocated: 6_817,
  nextRecurringLabel: 'Jun 15 · Car Service ₹4,500',
  monthClosesLabel: '18 days · Jun 30',
  userInitials: 'RK',
  notificationCount: 3,
};

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

function renderFooter(onLogTransaction = vi.fn(), onCommandPalette = vi.fn()) {
  render(
    <AppFooter
      config={mockConfig}
      metrics={mockMetrics}
      collapseAfterScrollPx={40}
      data={mockData}
      onLogTransaction={onLogTransaction}
      onCommandPalette={onCommandPalette}
    />,
  );
}

afterEach(() => scrollTo(0));

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('AppFooter rendering', () => {
  it('mirrors the pulse strip metric labels, not a separate set', () => {
    renderFooter();
    expect(screen.getByText('READY TO ASSIGN')).toBeDefined();
    expect(screen.getByText('MONTH SPEND')).toBeDefined();
    expect(screen.getByText('CLOSES IN')).toBeDefined();
  });

  it('renders readyToAssign as formatted INR', () => {
    renderFooter();
    expect(screen.getByText(/₹6,817/)).toBeDefined();
  });

  it('renders metric meta text', () => {
    renderFooter();
    expect(screen.getByText(/Pace: ₹4,210\/day/)).toBeDefined();
  });

  it('renders keyboard shortcut keys', () => {
    renderFooter();
    expect(screen.getByText('⌘K')).toBeDefined();
    expect(screen.getByText('N')).toBeDefined();
  });

  it('renders keyboard shortcut labels', () => {
    renderFooter();
    expect(screen.getByText('Command palette')).toBeDefined();
    expect(screen.getByText('Log transaction')).toBeDefined();
  });
});

// ─── Collapse behaviour — mutually exclusive with the header pulse strip ───────

describe('AppFooter collapse', () => {
  it('is collapsed at the top of the page, while the pulse strip is showing', () => {
    renderFooter();
    const footer = document.querySelector('.app-footer');
    expect(footer?.classList.contains('app-footer--collapsed')).toBe(true);
  });

  it('expands once scrolled past the same threshold that hides the pulse strip', () => {
    renderFooter();
    scrollTo(41);
    const footer = document.querySelector('.app-footer');
    expect(footer?.classList.contains('app-footer--collapsed')).toBe(false);
  });

  it('collapses again as soon as the user scrolls back up', () => {
    renderFooter();
    scrollTo(200);
    scrollTo(150);
    const footer = document.querySelector('.app-footer');
    expect(footer?.classList.contains('app-footer--collapsed')).toBe(true);
  });
});
