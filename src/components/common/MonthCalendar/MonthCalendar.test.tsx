import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MonthCalendar } from './MonthCalendar';
import type { CalendarTransaction } from './MonthCalendar';

afterEach(() => cleanup());

const TRANSACTIONS: Record<string, CalendarTransaction[]> = {
  '2026-06-13': [
    { id: '1', merchant: 'Zepto', amount: 890, type: 'debit' },
    { id: '2', merchant: 'Salary', amount: 85000, type: 'credit' },
  ],
};

describe('MonthCalendar', () => {
  describe('rendering', () => {
    it('renders month and year heading', () => {
      render(<MonthCalendar month={6} year={2026} />);
      expect(screen.getByText('June 2026')).toBeInTheDocument();
    });

    it('renders weekday headers', () => {
      render(<MonthCalendar month={6} year={2026} />);
      expect(screen.getByText('Su')).toBeInTheDocument();
      expect(screen.getByText('Sa')).toBeInTheDocument();
    });

    it('renders day buttons for June 2026 (30 days)', () => {
      render(<MonthCalendar month={6} year={2026} />);
      const dayBtns = screen.getAllByRole('gridcell').filter((el) => el.tagName === 'BUTTON');
      expect(dayBtns).toHaveLength(30);
    });

    it('renders nav buttons', () => {
      render(<MonthCalendar month={6} year={2026} />);
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    it('shows transaction panel when selectedDate provided', () => {
      render(
        <MonthCalendar
          month={6}
          year={2026}
          transactions={TRANSACTIONS}
          selectedDate="2026-06-13"
          onDayClick={vi.fn()}
        />,
      );
      expect(screen.getByText('Zepto')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    it('shows "No transactions" for day with no transactions', () => {
      render(
        <MonthCalendar
          month={6}
          year={2026}
          transactions={{}}
          selectedDate="2026-06-13"
          onDayClick={vi.fn()}
        />,
      );
      expect(screen.getByText('No transactions')).toBeInTheDocument();
    });
  });

  describe('no-spend highlight', () => {
    it('marks a day listed in noSpendDates', () => {
      render(<MonthCalendar month={6} year={2026} noSpendDates={['2026-06-13']} />);
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      expect(day13.className).toContain('month-cal__day--no-spend');
    });

    it('does not mark a day absent from noSpendDates', () => {
      render(<MonthCalendar month={6} year={2026} noSpendDates={['2026-06-13']} />);
      const day14 = screen.getByRole('gridcell', { name: /June 14, 2026/i });
      expect(day14.className).not.toContain('month-cal__day--no-spend');
    });

    it('does not apply the no-spend class to the selected day (selection wins)', () => {
      render(
        <MonthCalendar
          month={6}
          year={2026}
          noSpendDates={['2026-06-13']}
          selectedDate="2026-06-13"
        />,
      );
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      expect(day13.className).toContain('month-cal__day--selected');
      expect(day13.className).not.toContain('month-cal__day--no-spend');
    });
  });

  describe('today highlight', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 13));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('marks today with the --today class, distinct from --selected', () => {
      render(<MonthCalendar month={6} year={2026} />);
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      expect(day13.className).toContain('month-cal__day--today');
      expect(day13.className).not.toContain('month-cal__day--selected');
    });

    it('drops the --today class in favor of --selected when today is the selected day', () => {
      render(<MonthCalendar month={6} year={2026} selectedDate="2026-06-13" />);
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      expect(day13.className).toContain('month-cal__day--selected');
      expect(day13.className).not.toContain('month-cal__day--today');
    });

    it('can be both today and no-spend at once', () => {
      render(<MonthCalendar month={6} year={2026} noSpendDates={['2026-06-13']} />);
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      expect(day13.className).toContain('month-cal__day--today');
      expect(day13.className).toContain('month-cal__day--no-spend');
    });
  });

  describe('navigation', () => {
    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      render(<MonthCalendar month={6} year={2026} />);
      await user.click(screen.getByRole('button', { name: /previous month/i }));
      expect(screen.getByText('May 2026')).toBeInTheDocument();
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      render(<MonthCalendar month={6} year={2026} />);
      await user.click(screen.getByRole('button', { name: /next month/i }));
      expect(screen.getByText('July 2026')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onDayClick with date string', async () => {
      const user = userEvent.setup();
      const onDayClick = vi.fn();
      render(<MonthCalendar month={6} year={2026} onDayClick={onDayClick} />);
      const day13 = screen.getByRole('gridcell', { name: /June 13, 2026/i });
      await user.click(day13);
      expect(onDayClick).toHaveBeenCalledWith('2026-06-13');
    });
  });
});
