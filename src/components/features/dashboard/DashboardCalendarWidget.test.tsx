import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardCalendarWidget } from './DashboardCalendarWidget';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import type { DashboardCalendarResponse } from '@/hooks/useDashboardCalendar';

vi.mock('@/hooks/useDashboardCalendar', () => ({
  useDashboardCalendar: vi.fn(),
}));

const mockedUseDashboardCalendar = vi.mocked(useDashboardCalendar);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function baseData(overrides: Partial<DashboardCalendarResponse> = {}): DashboardCalendarResponse {
  return {
    year: 2026,
    month: 7,
    noSpendDays: [],
    incomeDays: [],
    billDue: [],
    bestStreak: 0,
    budgetPace: { plannedTotal: 0, actualTotal: 0, dayOfMonth: 18, totalDays: 31, spendPct: 0, timePct: 58 },
    transactions: [],
    ...overrides,
  };
}

// react-query's return shape has many fields — only what the component reads is relevant here.
function mockQuery(data: DashboardCalendarResponse | undefined, opts: { isLoading?: boolean; isError?: boolean } = {}) {
  mockedUseDashboardCalendar.mockReturnValue({
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as ReturnType<typeof useDashboardCalendar>);
}

describe('DashboardCalendarWidget', () => {
  it('shows a loading message while fetching', () => {
    mockQuery(undefined, { isLoading: true });
    render(<DashboardCalendarWidget />);
    expect(screen.getByText(/loading calendar/i)).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    mockQuery(undefined, { isError: true });
    render(<DashboardCalendarWidget />);
    expect(screen.getByText(/couldn't load the calendar/i)).toBeInTheDocument();
  });

  describe('budget pace', () => {
    it('renders the pace figures when a budget is planned', () => {
      mockQuery(baseData({ budgetPace: { plannedTotal: 40000, actualTotal: 24800, dayOfMonth: 18, totalDays: 31, spendPct: 62, timePct: 58 } }));
      render(<DashboardCalendarWidget />);
      expect(screen.getByText('62% spent · 58% of month')).toBeInTheDocument();
    });

    it('uses the warning variant when spend is ahead of the month elapsed', () => {
      mockQuery(baseData({ budgetPace: { plannedTotal: 40000, actualTotal: 30000, dayOfMonth: 18, totalDays: 31, spendPct: 75, timePct: 58 } }));
      const { container } = render(<DashboardCalendarWidget />);
      expect(container.querySelector('.progress--warning')).toBeInTheDocument();
    });

    it('uses the success variant when spend is on or under pace', () => {
      mockQuery(baseData({ budgetPace: { plannedTotal: 40000, actualTotal: 10000, dayOfMonth: 18, totalDays: 31, spendPct: 25, timePct: 58 } }));
      const { container } = render(<DashboardCalendarWidget />);
      expect(container.querySelector('.progress--success')).toBeInTheDocument();
    });

    it('hides the pace bar entirely when nothing is planned', () => {
      mockQuery(baseData());
      const { container } = render(<DashboardCalendarWidget />);
      expect(container.querySelector('.dashboard-calendar-widget__pace')).not.toBeInTheDocument();
    });
  });

  describe('best streak', () => {
    it('shows the streak line when there is a streak', () => {
      mockQuery(baseData({ bestStreak: 4 }));
      render(<DashboardCalendarWidget />);
      expect(screen.getByText(/best no-spend streak this month: 4 days/i)).toBeInTheDocument();
    });

    it('uses singular "day" for a streak of 1', () => {
      mockQuery(baseData({ bestStreak: 1 }));
      render(<DashboardCalendarWidget />);
      expect(screen.getByText(/best no-spend streak this month: 1 day$/i)).toBeInTheDocument();
    });

    it('hides the streak line when there is no streak yet', () => {
      mockQuery(baseData({ bestStreak: 0 }));
      render(<DashboardCalendarWidget />);
      expect(screen.queryByText(/best no-spend streak/i)).not.toBeInTheDocument();
    });
  });

  describe('upcoming bills', () => {
    it('shows a paid badge for settled bills and an amount for unpaid ones', () => {
      mockQuery(
        baseData({
          billDue: [
            { day: 5, name: 'Rent', amount: 15000, paid: true },
            { day: 25, name: 'Credit card', amount: 3200, paid: false },
          ],
        }),
      );
      render(<DashboardCalendarWidget />);
      expect(screen.getByText(/rent · due july 5/i)).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('₹3,200')).toBeInTheDocument();
    });

    it('hides the bills section when there are none', () => {
      mockQuery(baseData({ billDue: [] }));
      render(<DashboardCalendarWidget />);
      expect(screen.queryByText(/upcoming bills/i)).not.toBeInTheDocument();
    });
  });

  describe('calendar grid', () => {
    it('marks no-spend days and shows a dot for a real transaction', () => {
      mockQuery(
        baseData({
          noSpendDays: [2],
          transactions: [
            { id: 't1', date: '2026-07-09', type: 'EXPENSE', amount: 650, merchant: 'Big Bazaar', categoryName: 'Groceries' },
          ],
        }),
      );
      const { container } = render(<DashboardCalendarWidget />);
      const day2 = screen.getByRole('gridcell', { name: /July 2, 2026/i });
      expect(day2.className).toContain('month-cal__day--no-spend');
      expect(container.querySelector('.month-cal__dot--debit')).toBeInTheDocument();
    });
  });
});
