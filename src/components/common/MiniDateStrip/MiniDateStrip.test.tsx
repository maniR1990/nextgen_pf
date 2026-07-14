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
    it('renders every day from 14 days ago through today', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: dayName(5) })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: dayName(18) })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: dayName(4) })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: dayName(19) })).not.toBeInTheDocument();
    });

    it('marks the cell matching value as active', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: dayName(18) })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
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
      setVisible(['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18']);
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
      render(<MiniDateStrip value="2026-07-05" onChange={vi.fn()} />);
      setVisible(['2026-07-04', '2026-07-05', '2026-07-06']);
      expect(screen.getByRole('button', { name: /show later days/i })).not.toBeDisabled();
    });
  });

  describe('falling back to the full picker beyond the recent window', () => {
    it('opens the calendar instead of scrolling once the oldest day is already in view', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      setVisible(['2026-07-05', '2026-07-06', '2026-07-07']); // oldest allowed day (Jul 5) visible
      fireEvent.click(screen.getByRole('button', { name: /show earlier days/i }));
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('picking a date from the fallback calendar calls onChange and closes the picker', () => {
      const onChange = vi.fn();
      render(<MiniDateStrip value="2026-07-18" onChange={onChange} />);
      setVisible(['2026-07-05', '2026-07-06', '2026-07-07']);
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

  describe('per-cell month label', () => {
    it('shows the month abbreviation on every cell', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} />);
      expect(screen.getAllByText('Jul').length).toBe(14);
    });

    it("shows each cell's own month when the recent window spans a boundary", () => {
      vi.setSystemTime(new Date(2026, 6, 3));
      render(<MiniDateStrip value="2026-07-03" onChange={vi.fn()} />);
      // 14-day window ending Jul 3 starts Jun 20 — 11 Jun cells, 3 Jul cells.
      expect(screen.getAllByText('Jun').length).toBe(11);
      expect(screen.getAllByText('Jul').length).toBe(3);
    });
  });

  describe('required + error passthrough', () => {
    it('passes through error and required to the underlying FormField', () => {
      render(<MiniDateStrip value="2026-07-18" onChange={vi.fn()} error="Required" required />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });
  });
});
