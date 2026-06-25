import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppFooter } from './AppFooter';
import type { AppFooterConfig } from '@/lib/schemas/appFooter';
import type { AppHeaderData } from '@/lib/schemas/appHeader';

const mockConfig: AppFooterConfig = {
  collapseAfterMs: 10000,
  items: [
    { id: 'pending',       label: 'PENDING',        dataKey: 'pendingCount',      unit: 'transactions' },
    { id: 'spendPace',     label: 'SPEND PACE',     dataKey: 'spendPaceLabel' },
    { id: 'unallocated',   label: 'UNALLOCATED',    dataKey: 'unallocated',       format: 'currency-inr', badge: 'ready' },
    { id: 'nextRecurring', label: 'NEXT RECURRING', dataKey: 'nextRecurringLabel' },
    { id: 'monthCloses',   label: 'MONTH CLOSES',   dataKey: 'monthClosesLabel' },
  ],
  shortcuts: [
    { id: 'commandPalette', label: 'Command palette', key: '⌘K', action: 'commandPalette' },
    { id: 'logTransaction', label: 'Log transaction', key: 'N',  action: 'logTransaction' },
  ],
};

const mockData: Pick<AppHeaderData,
  'pendingCount' | 'spendPaceLabel' | 'spendPaceChangePct' | 'unallocated' |
  'nextRecurringLabel' | 'monthClosesLabel'
> = {
  pendingCount: 3,
  spendPaceLabel: 'Pace: ₹4,210/day',
  spendPaceChangePct: 12,
  unallocated: 6_817,
  nextRecurringLabel: 'Jun 15 · Car Service ₹4,500',
  monthClosesLabel: '18 days · Jun 30',
};

function renderFooter(onLogTransaction = vi.fn(), onCommandPalette = vi.fn()) {
  render(
    <AppFooter
      config={mockConfig}
      data={mockData}
      onLogTransaction={onLogTransaction}
      onCommandPalette={onCommandPalette}
    />
  );
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('AppFooter rendering', () => {
  it('renders all item labels', () => {
    renderFooter();
    expect(screen.getByText('PENDING')).toBeDefined();
    expect(screen.getByText('SPEND PACE')).toBeDefined();
    expect(screen.getByText('UNALLOCATED')).toBeDefined();
    expect(screen.getByText('NEXT RECURRING')).toBeDefined();
    expect(screen.getByText('MONTH CLOSES')).toBeDefined();
  });

  it('renders pending count with unit', () => {
    renderFooter();
    expect(screen.getByText(/3 transactions/i)).toBeDefined();
  });

  it('renders spend pace label', () => {
    renderFooter();
    expect(screen.getByText(/₹4,210\/day/)).toBeDefined();
  });

  it('renders unallocated as formatted INR', () => {
    renderFooter();
    expect(screen.getByText(/₹6,817/)).toBeDefined();
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

// ─── Collapse behaviour ────────────────────────────────────────────────────────

describe('AppFooter collapse', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is expanded by default', () => {
    renderFooter();
    const footer = document.querySelector('.app-footer');
    expect(footer?.classList.contains('app-footer--collapsed')).toBe(false);
  });

  it('collapses to accent line after collapseAfterMs', () => {
    renderFooter();
    act(() => { vi.advanceTimersByTime(10_000); });
    const footer = document.querySelector('.app-footer');
    expect(footer?.classList.contains('app-footer--collapsed')).toBe(true);
  });

  it('re-expands on mouse enter', () => {
    renderFooter();
    const footer = document.querySelector('.app-footer')!;
    act(() => { vi.advanceTimersByTime(10_000); });
    act(() => { footer.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); });
    expect(footer.classList.contains('app-footer--collapsed')).toBe(false);
  });
});
