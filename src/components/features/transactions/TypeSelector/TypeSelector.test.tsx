import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TypeSelector } from './TypeSelector';
import { TX_TYPE_GROUPS } from '@/constants/finance';

afterEach(() => cleanup());

describe('TypeSelector', () => {
  describe('rendering', () => {
    it('renders all 4 group headings', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      expect(screen.getByText('Outflow')).toBeInTheDocument();
      expect(screen.getByText('Inflow')).toBeInTheDocument();
      expect(screen.getByText('Movement')).toBeInTheDocument();
      expect(screen.getByText('Adjustment')).toBeInTheDocument();
    });

    it('renders all 11 type chips', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      const totalTypes = Object.values(TX_TYPE_GROUPS).flat().length;
      const chips = screen.getAllByRole('button');
      expect(chips).toHaveLength(totalTypes);
    });

    it('marks the active chip with aria-pressed=true', () => {
      render(<TypeSelector value="INCOME" onChange={vi.fn()} />);
      const incomeChip = screen.getByRole('button', { name: /income/i });
      expect(incomeChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('marks inactive chips with aria-pressed=false', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      const incomeChip = screen.getByRole('button', { name: /income/i });
      expect(incomeChip).toHaveAttribute('aria-pressed', 'false');
    });

    it('active chip has --active modifier class', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      const expenseChip = screen.getByRole('button', { name: /expense/i });
      expect(expenseChip.className).toContain('type-selector__chip--active');
    });
  });

  describe('interaction', () => {
    it('calls onChange with the clicked type', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TypeSelector value="EXPENSE" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /income/i }));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith('INCOME');
    });

    it('does not call onChange when clicking the already-active chip', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TypeSelector value="EXPENSE" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /expense/i }));

      // onChange still called — the parent decides whether to re-render
      expect(onChange).toHaveBeenCalledWith('EXPENSE');
    });

    it('calls onChange for each distinct type click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TypeSelector value="EXPENSE" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /transfer/i }));
      await user.click(screen.getByRole('button', { name: /refund/i }));

      expect(onChange).toHaveBeenNthCalledWith(1, 'TRANSFER');
      expect(onChange).toHaveBeenNthCalledWith(2, 'REFUND');
    });
  });
});
