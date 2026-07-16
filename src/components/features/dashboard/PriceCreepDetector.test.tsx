import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PriceCreepDetector } from './PriceCreepDetector';
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

describe('PriceCreepDetector', () => {
  it('renders nothing while loading', () => {
    mockQuery(undefined, { isLoading: true });
    const { container } = render(<PriceCreepDetector />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on error', () => {
    mockQuery(undefined, { isError: true });
    const { container } = render(<PriceCreepDetector />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no price increases', () => {
    mockQuery(baseData({ priceIncreases: [] }));
    const { container } = render(<PriceCreepDetector />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per price increase with old/new price, badge, and first-charged date', () => {
    mockQuery(
      baseData({
        priceIncreases: [
          {
            id: 'a',
            name: 'Netflix',
            oldAmount: 500,
            newAmount: 650,
            deltaAmount: 150,
            deltaPct: 30,
            changedDate: '2026-07-05',
          },
        ],
      }),
    );
    render(<PriceCreepDetector />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹650')).toBeInTheDocument();
    expect(screen.getByText('+30% · +₹150/month')).toBeInTheDocument();
    expect(screen.getByText(/first charged this amount on 5 jul 2026/i)).toBeInTheDocument();
  });

  it('renders multiple cards, one per price increase', () => {
    mockQuery(
      baseData({
        priceIncreases: [
          { id: 'a', name: 'Netflix', oldAmount: 500, newAmount: 650, deltaAmount: 150, deltaPct: 30, changedDate: '2026-07-05' },
          { id: 'b', name: 'Gym', oldAmount: 1000, newAmount: 1100, deltaAmount: 100, deltaPct: 10, changedDate: '2026-07-10' },
        ],
      }),
    );
    render(<PriceCreepDetector />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });
});
