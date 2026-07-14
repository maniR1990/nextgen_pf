import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MiniDateStrip } from './MiniDateStrip';

afterEach(() => cleanup());

// Sat 18 Jul 2026 — local time, matches how the component reads `new Date()`.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 18));
});

// en-IN formats as "18 Jul 2026" (day before month) — matches every other date
// format already used across this app.
function dayName(day: number) {
  return new RegExp(`^${day} Jul 2026$`);
}

describe('MiniDateStrip', () => {
  describe('default window', () => {
    it('shows the 5 most recent days ending today, each labeled with month + day', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      for (const day of [14, 15, 16, 17, 18]) {
        expect(screen.getByRole('button', { name: dayName(day) })).toBeInTheDocument();
      }
    });

    it('marks the cell matching value as active', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: dayName(18) })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('disables the forward arrow when the window already ends today', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /show later days/i })).toBeDisabled();
    });
  });

  describe('future dates', () => {
    it('does not render any day after today', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.queryByRole('button', { name: dayName(19) })).not.toBeInTheDocument();
    });
  });

  describe('selecting a day', () => {
    it('calls onChange with the ISO date when a visible day is clicked', () => {
      const onChange = vi.fn();
      render(<MiniDateStrip value="2026-07-18" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: dayName(16) }));
      expect(onChange).toHaveBeenCalledWith('2026-07-16');
    });
  });

  describe('navigating within the recent window', () => {
    it('shifts the window back one day without disturbing the selection when "‹" is clicked', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /show earlier days/i }));
      // Window is now Jul 13–17 — Jul 13 newly visible, Jul 18 scrolled out.
      expect(screen.getByRole('button', { name: dayName(13) })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: dayName(18) })).not.toBeInTheDocument();
    });

    it('shifts the window forward when "›" is clicked after moving back', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      const back = screen.getByRole('button', { name: /show earlier days/i });
      fireEvent.click(back);
      fireEvent.click(screen.getByRole('button', { name: /show later days/i }));
      expect(screen.getByRole('button', { name: dayName(18) })).toBeInTheDocument();
    });
  });

  describe('falling back to the full picker beyond the recent window', () => {
    it('opens the calendar instead of scrolling further once the 14-day boundary is reached', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      const back = screen.getByRole('button', { name: /show earlier days/i });
      // Window starts at Jul14–18 (oldest visible Jul 14). The recent-window floor is
      // Jul 5 (today - 13). Each click walks the window back by one day; once the
      // oldest visible day would go past Jul 5, the click opens the picker instead.
      for (let i = 0; i < 10; i++) {
        fireEvent.click(back);
      }
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('picking a date from the fallback calendar calls onChange and closes the picker', () => {
      const onChange = vi.fn();
      render(<MiniDateStrip value="2026-07-18" onChange={onChange} />);
      const back = screen.getByRole('button', { name: /show earlier days/i });
      for (let i = 0; i < 10; i++) {
        fireEvent.click(back);
      }
      expect(screen.getByRole('grid')).toBeInTheDocument();

      const gridCells = screen
        .getAllByRole('gridcell')
        .filter((c) => c.getAttribute('aria-disabled') === 'false');
      fireEvent.click(gridCells[0]);
      expect(onChange).toHaveBeenCalled();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('value outside the visible window', () => {
    it('shows a "Selected" hint when the value is further back than the recent window covers', () => {
      render(<MiniDateStrip value="2026-06-01" onChange={vi.fn()} />);
      expect(screen.getByText(/selected/i)).toBeInTheDocument();
    });

    it('does not show the hint when the value is within the visible window', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.queryByText(/selected:/i)).not.toBeInTheDocument();
    });
  });

  describe('required + error passthrough', () => {
    it('passes through error and required to the underlying FormField', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} error="Required" required />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });
  });

  describe('showMonth', () => {
    it('renders the month abbreviation by default', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getAllByText('Jul').length).toBeGreaterThan(0);
    });

    it('hides the month abbreviation when showMonth is false, keeping the day number and label', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} showMonth={false} />);
      expect(screen.queryByText('Jul')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: dayName(18) })).toBeInTheDocument();
    });
  });
});
