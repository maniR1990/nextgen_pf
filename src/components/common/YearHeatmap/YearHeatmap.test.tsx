import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { YearHeatmap } from './YearHeatmap';
import type { HeatmapDay } from './YearHeatmap';

afterEach(() => cleanup());

const SAMPLE_DATA: HeatmapDay[] = [
  { date: '2026-01-05', amount: 1200 },
  { date: '2026-03-15', amount: 4500 },
  { date: '2026-06-13', amount: 890 },
  { date: '2026-12-25', amount: 3200 },
];

describe('YearHeatmap', () => {
  describe('rendering', () => {
    it('renders year title', () => {
      render(<YearHeatmap year={2026} data={[]} />);
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('renders day cells for the year', () => {
      render(<YearHeatmap year={2026} data={[]} />);
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(300);
    });

    it('renders day cell with aria-label including amount', () => {
      render(<YearHeatmap year={2026} data={SAMPLE_DATA} />);
      expect(screen.getByRole('button', { name: /2026-06-13/i })).toBeInTheDocument();
    });

    it('renders month rows for mobile view', () => {
      render(<YearHeatmap year={2026} data={SAMPLE_DATA} />);
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Dec')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onDayClick with date and amount', async () => {
      const user = userEvent.setup();
      const onDayClick = vi.fn();
      render(<YearHeatmap year={2026} data={SAMPLE_DATA} onDayClick={onDayClick} />);
      const cell = screen.getByRole('button', { name: /2026-06-13/i });
      await user.click(cell);
      expect(onDayClick).toHaveBeenCalledWith('2026-06-13', 890);
    });

    it('does not throw when onDayClick is not provided', async () => {
      const user = userEvent.setup();
      render(<YearHeatmap year={2026} data={SAMPLE_DATA} />);
      const cells = screen.getAllByRole('button');
      await expect(user.click(cells[0])).resolves.not.toThrow();
    });
  });

  describe('empty state', () => {
    it('renders with no data without errors', () => {
      expect(() => render(<YearHeatmap year={2026} data={[]} />)).not.toThrow();
    });
  });
});
