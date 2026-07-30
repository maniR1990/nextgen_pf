import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

// jsdom has no real layout, so IntersectionObserver never fires on its own.
// This test-local mock captures every instance the component creates and lets
// a test declare "these isos are currently scrolled into view" directly,
// which is what a real browser would eventually report after a scroll.
class TestIntersectionObserver implements IntersectionObserver {
  static instances: TestIntersectionObserver[] = [];
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;
  private observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    TestIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  fireVisible(isos: string[]) {
    const entries = this.observed.map(
      (el) =>
        ({
          target: el,
          isIntersecting: isos.includes((el as HTMLElement).dataset.iso ?? ''),
        }) as IntersectionObserverEntry,
    );
    this.callback(entries, this);
  }
}

beforeEach(() => {
  TestIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
});

function setVisible(isos: string[]) {
  const observer = TestIntersectionObserver.instances.at(-1);
  if (!observer) throw new Error('No IntersectionObserver instance created yet');
  act(() => observer.fireVisible(isos));
}

describe('MiniDateStrip', () => {
  describe('rendering the recent window', () => {
    it('renders exactly the last 5 days, today included', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: dayName(14) })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: dayName(18) })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: dayName(13) })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: dayName(19) })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /jul 2026$/i })).toHaveLength(5);
    });

    it('marks the cell matching value as active', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: dayName(18) })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('per-cell weekday label', () => {
    it("shows today's cell as \"Today\" instead of its weekday name", () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      const todayCell = screen.getByRole('button', { name: dayName(18) });
      expect(todayCell).toHaveTextContent('Today');
      // Sat 18 Jul 2026 — "Sat" must not also appear on the today cell.
      expect(todayCell).not.toHaveTextContent('Sat');
    });

    it('shows the short weekday name under the date for every other cell', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      // Fri 17 Jul 2026
      const cell = screen.getByRole('button', { name: dayName(17) });
      expect(cell).toHaveTextContent('17');
      expect(cell).toHaveTextContent('Fri');
    });

    it('never shows "Today" on a cell other than the actual current day', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      for (const day of [14, 15, 16, 17]) {
        expect(screen.getByRole('button', { name: dayName(day) })).not.toHaveTextContent('Today');
      }
    });
  });

  describe('selecting a day', () => {
    it('calls onChange with the ISO date when a day cell is clicked', () => {
      const onChange = vi.fn();
      render(<MiniDateStrip value="2026-07-18" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: dayName(16) }));
      expect(onChange).toHaveBeenCalledWith('2026-07-16');
    });
  });

  describe('scrolling within the recent window', () => {
    it('scrolls the container back one cell when "‹" is clicked and today is not the oldest visible day', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      setVisible(['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18']);
      const days = screen.getByRole('group', { name: /select a recent date/i });
      const scrollBySpy = vi.spyOn(days, 'scrollBy');
      fireEvent.click(screen.getByRole('button', { name: /show earlier days/i }));
      expect(scrollBySpy).toHaveBeenCalled();
    });

    it('disables the forward arrow once today is scrolled into view', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      setVisible(['2026-07-16', '2026-07-17', '2026-07-18']);
      expect(screen.getByRole('button', { name: /show later days/i })).toBeDisabled();
    });

    it('leaves the forward arrow enabled while today is scrolled out of view', () => {
      render(<MiniDateStrip value="2026-07-14" onChange={vi.fn()} />);
      setVisible(['2026-07-14', '2026-07-15', '2026-07-16']);
      expect(screen.getByRole('button', { name: /show later days/i })).not.toBeDisabled();
    });
  });

  describe('falling back to the full picker beyond the recent window', () => {
    it('opens the calendar instead of scrolling once the oldest day is already in view', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      setVisible(['2026-07-14', '2026-07-15', '2026-07-16']); // oldest allowed day (Jul 14) visible
      fireEvent.click(screen.getByRole('button', { name: /show earlier days/i }));
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('picking a date from the fallback calendar calls onChange and closes the picker', () => {
      const onChange = vi.fn();
      render(<MiniDateStrip value="2026-07-18" onChange={onChange} />);
      setVisible(['2026-07-14', '2026-07-15', '2026-07-16']);
      fireEvent.click(screen.getByRole('button', { name: /show earlier days/i }));
      expect(screen.getByRole('grid')).toBeInTheDocument();

      const gridCells = screen
        .getAllByRole('gridcell')
        .filter((c) => c.getAttribute('aria-disabled') === 'false');
      fireEvent.click(gridCells[0]);
      expect(onChange).toHaveBeenCalled();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('value outside the current view', () => {
    it('shows a "Selected" hint when the value is not among the currently visible cells', () => {
      render(<MiniDateStrip value="2026-07-05" onChange={vi.fn()} />);
      setVisible(['2026-07-16', '2026-07-17', '2026-07-18']);
      expect(screen.getByText(/selected: 5 jul 2026/i)).toBeInTheDocument();
    });

    it('does not show the hint once the value scrolls into view', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      setVisible(['2026-07-16', '2026-07-17', '2026-07-18']);
      expect(screen.queryByText(/selected:/i)).not.toBeInTheDocument();
    });
  });

  describe('required + error passthrough', () => {
    it('passes through error and required to the underlying FormField', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} error="Required" required />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });
  });
});
