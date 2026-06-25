import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonthPicker } from './MonthPicker';

afterEach(() => cleanup());

describe('MonthPicker', () => {
  describe('rendering', () => {
    it('renders 12 month buttons', () => {
      render(<MonthPicker />);
      const btns = screen.getAllByRole('button');
      // 12 months + 2 nav buttons
      const monthBtns = btns.filter(b => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(b.textContent ?? ''));
      expect(monthBtns).toHaveLength(12);
    });

    it('renders year navigation buttons', () => {
      render(<MonthPicker />);
      expect(screen.getByRole('button', { name: /previous year/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next year/i })).toBeInTheDocument();
    });

    it('renders label when provided', () => {
      render(<MonthPicker label="Budget month" />);
      expect(screen.getByText('Budget month')).toBeInTheDocument();
    });

    it('marks selected month with aria-pressed=true', () => {
      render(<MonthPicker value={{ month: 6, year: 2026 }} onChange={vi.fn()} />);
      const jun = screen.getByRole('button', { name: /jun 2026/i });
      expect(jun).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows selected month in footer', () => {
      render(<MonthPicker value={{ month: 6, year: 2026 }} onChange={vi.fn()} />);
      expect(screen.getByText(/Jun 2026/)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('decrements year on prev click', async () => {
      const user = userEvent.setup();
      render(<MonthPicker />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(String(currentYear))).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /previous year/i }));
      expect(screen.getByText(String(currentYear - 1))).toBeInTheDocument();
    });

    it('increments year on next click', async () => {
      const user = userEvent.setup();
      render(<MonthPicker />);
      const currentYear = new Date().getFullYear();
      await user.click(screen.getByRole('button', { name: /next year/i }));
      expect(screen.getByText(String(currentYear + 1))).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange with month and year when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MonthPicker onChange={onChange} />);
      const currentYear = new Date().getFullYear();
      await user.click(screen.getByRole('button', { name: `Jun ${currentYear}` }));
      expect(onChange).toHaveBeenCalledWith({ month: 6, year: currentYear });
    });

    it('calls onChange with correct year after navigation', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MonthPicker onChange={onChange} />);
      const currentYear = new Date().getFullYear();
      await user.click(screen.getByRole('button', { name: /next year/i }));
      await user.click(screen.getByRole('button', { name: `Jan ${currentYear + 1}` }));
      expect(onChange).toHaveBeenCalledWith({ month: 1, year: currentYear + 1 });
    });
  });
});
