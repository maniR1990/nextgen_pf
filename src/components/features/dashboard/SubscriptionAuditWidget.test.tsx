import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionAuditWidget } from './SubscriptionAuditWidget';
import { useDashboardSubscriptions } from '@/hooks/useDashboardSubscriptions';
import type { DashboardSubscriptionsResponse } from '@/hooks/useDashboardSubscriptions';
import type { SubscriptionItem } from '@/app/api/v1/dashboard/subscriptions/derive';

function sub(overrides: Partial<SubscriptionItem> = {}): SubscriptionItem {
  return {
    id: 'a',
    name: 'Netflix',
    frequency: 'MONTHLY',
    nextRenewal: '2026-08-05',
    amount: 500,
    previousAmount: null,
    categoryName: 'Entertainment',
    ...overrides,
  };
}

vi.mock('@/hooks/useDashboardSubscriptions', () => ({
  useDashboardSubscriptions: vi.fn(),
}));

const mockedUseDashboardSubscriptions = vi.mocked(useDashboardSubscriptions);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function baseData(
  overrides: Partial<DashboardSubscriptionsResponse> = {},
): DashboardSubscriptionsResponse {
  return {
    monthlyTotal: 0,
    deltaPct: 0,
    annualizedTotal: 0,
    percentOfSpend: null,
    subscriptions: [],
    priceIncreases: [],
    byCategory: [],
    byAccount: [],
    ...overrides,
  };
}

function mockQuery(
  data: DashboardSubscriptionsResponse | undefined,
  opts: { isLoading?: boolean; isError?: boolean } = {},
) {
  mockedUseDashboardSubscriptions.mockReturnValue({
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as ReturnType<typeof useDashboardSubscriptions>);
}

describe('SubscriptionAuditWidget', () => {
  it('shows a loading message while fetching', () => {
    mockQuery(undefined, { isLoading: true });
    render(<SubscriptionAuditWidget />);
    expect(screen.getByText(/loading subscriptions/i)).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    mockQuery(undefined, { isError: true });
    render(<SubscriptionAuditWidget />);
    expect(screen.getByText(/couldn't load subscriptions/i)).toBeInTheDocument();
  });

  describe('headline', () => {
    it('reads "steady" when there is no delta and no price increases', () => {
      mockQuery(baseData({ deltaPct: 0 }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText(/recurring costs are steady this cycle/i)).toBeInTheDocument();
    });

    it('reads "up" with the increase count when costs rose due to price increases', () => {
      mockQuery(
        baseData({
          deltaPct: 12,
          priceIncreases: [
            { id: 'a', name: 'Netflix', oldAmount: 500, newAmount: 650, deltaAmount: 150, deltaPct: 30, changedDate: '2026-07-05' },
            { id: 'b', name: 'Gym', oldAmount: 1000, newAmount: 1100, deltaAmount: 100, deltaPct: 10, changedDate: '2026-07-10' },
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(
        screen.getByText(/recurring costs are up 12% this cycle — driven by 2 price increases/i),
      ).toBeInTheDocument();
    });

    it('uses singular "increase" for exactly one price increase', () => {
      mockQuery(
        baseData({
          deltaPct: 30,
          priceIncreases: [
            { id: 'a', name: 'Netflix', oldAmount: 500, newAmount: 650, deltaAmount: 150, deltaPct: 30, changedDate: '2026-07-05' },
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText(/driven by 1 price increase\.$/i)).toBeInTheDocument();
    });

    it('reads "down" when costs fell, with no increase clause', () => {
      mockQuery(baseData({ deltaPct: -8 }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText(/recurring costs are down 8% this cycle/i)).toBeInTheDocument();
    });
  });

  describe('monthly total tile', () => {
    it('shows the monthly figure and annualized/percent-of-spend subtext', () => {
      mockQuery(baseData({ monthlyTotal: 4200, annualizedTotal: 50400, percentOfSpend: 18 }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('₹4,200')).toBeInTheDocument();
      expect(screen.getByText(/₹50,400\/yr · 18% of monthly spend/i)).toBeInTheDocument();
    });

    it('omits the percent-of-spend clause when it is null', () => {
      mockQuery(baseData({ monthlyTotal: 4200, annualizedTotal: 50400, percentOfSpend: null }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText(/₹50,400\/yr$/)).toBeInTheDocument();
    });
  });

  describe('subscriptions list', () => {
    it('shows a plain amount for an unchanged subscription', () => {
      mockQuery(baseData({ subscriptions: [sub()] }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
    });

    it('shows a struck-through old price and a delta badge for a changed subscription', () => {
      mockQuery(baseData({ subscriptions: [sub({ amount: 650, previousAmount: 500 })] }));
      const { container } = render(<SubscriptionAuditWidget />);
      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('₹650')).toBeInTheDocument();
      expect(screen.getByText('+₹150')).toBeInTheDocument();
      expect(container.querySelector('.subscription-audit-widget__old-amount')).toBeInTheDocument();
    });

    it('hides the section entirely when there are no subscriptions', () => {
      mockQuery(baseData({ subscriptions: [] }));
      const { container } = render(<SubscriptionAuditWidget />);
      expect(container.querySelector('.subscription-audit-widget__list')).not.toBeInTheDocument();
    });

    it('defaults to the By date view, listing every item with its own frequency', () => {
      mockQuery(
        baseData({
          subscriptions: [
            sub({ id: 'a', name: 'Netflix', frequency: 'MONTHLY' }),
            sub({ id: 'b', name: 'Insurance', frequency: 'ANNUAL', amount: 12000 }),
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Insurance')).toBeInTheDocument();
      expect(screen.getByText('Annual · renews 5 Aug')).toBeInTheDocument();
    });

    it('switches to By cycle grouping, with a monthly-equivalent subtotal per frequency', () => {
      mockQuery(
        baseData({
          subscriptions: [
            sub({ id: 'a', name: 'Netflix', frequency: 'MONTHLY', amount: 500 }),
            sub({
              id: 'b',
              name: 'Insurance',
              frequency: 'ANNUAL',
              amount: 12000,
              nextRenewal: '2026-08-10',
            }),
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      fireEvent.click(screen.getByRole('button', { name: 'By cycle' }));
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('₹500/mo')).toBeInTheDocument();
      expect(screen.getByText('Annual')).toBeInTheDocument();
      expect(screen.getByText('₹1,000/mo')).toBeInTheDocument();
      // Grouped view shows renewal date only — frequency already reads as the group heading.
      expect(screen.getByText('renews 10 Aug')).toBeInTheDocument();
    });
  });

  describe('by category', () => {
    it('renders each category collapsed by default, with its item count', () => {
      mockQuery(
        baseData({
          subscriptions: [sub({ id: 'a', categoryName: 'Entertainment' })],
          byCategory: [{ label: 'Entertainment', amount: 500 }],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('1 item')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Entertainment/ })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('expands a category to show only the items filed under it', () => {
      mockQuery(
        baseData({
          subscriptions: [
            sub({ id: 'a', name: 'Netflix', categoryName: 'Entertainment' }),
            sub({ id: 'b', name: 'Term Insurance', categoryName: 'Insurance' }),
          ],
          byCategory: [
            { label: 'Entertainment', amount: 500 },
            { label: 'Insurance', amount: 7000 },
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      fireEvent.click(screen.getByRole('button', { name: /Entertainment/ }));
      expect(screen.getByRole('button', { name: /Entertainment/ })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      // Insurance's own item shouldn't leak into Entertainment's expanded list.
      const entertainmentCard = screen.getByRole('button', { name: /Entertainment/ }).closest(
        '.subscription-audit-widget__catcard',
      );
      expect(entertainmentCard).not.toBeNull();
      expect(entertainmentCard!.textContent).toContain('Netflix');
      expect(entertainmentCard!.textContent).not.toContain('Term Insurance');
    });

    it('switches category totals between monthly and yearly', () => {
      mockQuery(
        baseData({
          subscriptions: [sub()],
          byCategory: [{ label: 'Entertainment', amount: 500 }],
        }),
      );
      const { container } = render(<SubscriptionAuditWidget />);
      const catAmt = () => container.querySelector('.subscription-audit-widget__cat-amt');
      expect(catAmt()?.textContent).toBe('₹500');
      fireEvent.click(screen.getByRole('button', { name: 'Yearly' }));
      expect(catAmt()?.textContent).toBe('₹6,000');
    });
  });

  describe('by account', () => {
    it('renders account rows when present', () => {
      mockQuery(baseData({ byAccount: [{ label: 'HDFC Card', amount: 500 }] }));
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('HDFC Card')).toBeInTheDocument();
    });

    it('hides category and account sections when empty', () => {
      mockQuery(baseData({ byCategory: [], byAccount: [] }));
      const { container } = render(<SubscriptionAuditWidget />);
      expect(container.querySelector('.subscription-audit-widget__categories')).not.toBeInTheDocument();
      expect(screen.queryByText('By account')).not.toBeInTheDocument();
    });
  });
});
