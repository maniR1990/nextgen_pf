import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionAuditWidget } from './SubscriptionAuditWidget';
import { useDashboardSubscriptions } from '@/hooks/useDashboardSubscriptions';
import type { DashboardSubscriptionsResponse } from '@/hooks/useDashboardSubscriptions';

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
      mockQuery(
        baseData({
          subscriptions: [
            { id: 'a', name: 'Netflix', frequency: 'MONTHLY', nextRenewal: '2026-08-05', amount: 500, previousAmount: null },
          ],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
    });

    it('shows a struck-through old price and a delta badge for a changed subscription', () => {
      mockQuery(
        baseData({
          subscriptions: [
            { id: 'a', name: 'Netflix', frequency: 'MONTHLY', nextRenewal: '2026-08-05', amount: 650, previousAmount: 500 },
          ],
        }),
      );
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
  });

  describe('breakdowns', () => {
    it('renders category and account rows when present', () => {
      mockQuery(
        baseData({
          byCategory: [{ label: 'Entertainment', amount: 500 }],
          byAccount: [{ label: 'HDFC Card', amount: 500 }],
        }),
      );
      render(<SubscriptionAuditWidget />);
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('HDFC Card')).toBeInTheDocument();
    });

    it('hides breakdown sections when empty', () => {
      mockQuery(baseData({ byCategory: [], byAccount: [] }));
      const { container } = render(<SubscriptionAuditWidget />);
      expect(container.querySelector('.subscription-audit-widget__breakdown')).not.toBeInTheDocument();
    });
  });
});
