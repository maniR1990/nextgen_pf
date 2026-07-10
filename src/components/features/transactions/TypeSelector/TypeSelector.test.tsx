import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TypeSelector } from './TypeSelector';

afterEach(() => cleanup());

async function openMoreTypes(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /more transaction types/i }));
}

describe('TypeSelector', () => {
  describe('collapsed by default', () => {
    it('shows only Expense and Income up front', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /expense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /transfer/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
    });

    it('shows a "More transaction types" toggle', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /more transaction types/i })).toBeInTheDocument();
    });

    it('auto-expands when the active type is one of the hidden ones', () => {
      render(<TypeSelector value="TRANSFER" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /^transfer$/i })).toBeInTheDocument();
    });
  });

  describe('expanding', () => {
    it('reveals the remaining 9 types after clicking "More transaction types"', async () => {
      const user = userEvent.setup();
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);

      await openMoreTypes(user);

      for (const name of [
        'Transfer',
        'ATM Withdrawal',
        'Investment',
        'Sinking',
        'Gift Received',
        'Reimbursement',
        'Refund',
        'Coupon Use',
        'Points Redeem',
      ]) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      }
    });

    it('all 11 types are present once expanded, none duplicated', async () => {
      const user = userEvent.setup();
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      await openMoreTypes(user);
      expect(screen.getAllByRole('button', { name: /expense/i })).toHaveLength(1);
    });
  });

  describe('active state', () => {
    it('marks the active chip with aria-pressed=true', () => {
      render(<TypeSelector value="INCOME" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /income/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('marks inactive chips with aria-pressed=false', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /income/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('active chip has --active modifier class', () => {
      render(<TypeSelector value="EXPENSE" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /expense/i }).className).toContain(
        'type-selector__chip--active',
      );
    });
  });

  describe('interaction', () => {
    it('calls onChange with the clicked type', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TypeSelector value="EXPENSE" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /income/i }));

      expect(onChange).toHaveBeenCalledWith('INCOME');
    });

    it('calls onChange for a type revealed by expanding', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TypeSelector value="EXPENSE" onChange={onChange} />);

      await openMoreTypes(user);
      await user.click(screen.getByRole('button', { name: /^transfer$/i }));

      expect(onChange).toHaveBeenCalledWith('TRANSFER');
    });
  });
});
