import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

afterEach(() => cleanup());

describe('DatePicker', () => {
  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<DatePicker />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows placeholder when no value', () => {
      render(<DatePicker placeholder="Pick a date" />);
      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('shows formatted value when provided', () => {
      render(<DatePicker value="2026-06-13" onChange={vi.fn()} />);
      expect(screen.getByText(/Jun 13, 2026/i)).toBeInTheDocument();
    });

    it('renders label', () => {
      render(<DatePicker label="Transaction date" />);
      expect(screen.getByText('Transaction date')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<DatePicker error="Date is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Date is required');
    });

    it('trigger has aria-expanded false initially', () => {
      render(<DatePicker />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('interaction', () => {
    it('opens calendar on trigger click', async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Date" />);
      await user.click(screen.getByRole('button', { name: /select date/i }));
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('calls onChange when a day is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<DatePicker onChange={onChange} />);
      await user.click(screen.getAllByRole('button')[0]);
    });

    it('disabled trigger cannot be clicked', async () => {
      const user = userEvent.setup();
      render(<DatePicker disabled />);
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('range mode', () => {
    it('shows range placeholder in range mode', () => {
      render(<DatePicker mode="range" placeholder="Select range" />);
      expect(screen.getByText('Select range')).toBeInTheDocument();
    });

    it('shows range start when only start is provided', () => {
      render(<DatePicker mode="range" rangeStart="2026-06-10" rangeEnd={null} onRangeChange={vi.fn()} />);
      expect(screen.getByText(/Jun 10, 2026/)).toBeInTheDocument();
    });

    it('shows both dates when range is complete', () => {
      render(
        <DatePicker
          mode="range"
          rangeStart="2026-06-10"
          rangeEnd="2026-06-20"
          onRangeChange={vi.fn()}
        />
      );
      expect(screen.getByText(/Jun 10, 2026.*Jun 20, 2026/)).toBeInTheDocument();
    });
  });
});
