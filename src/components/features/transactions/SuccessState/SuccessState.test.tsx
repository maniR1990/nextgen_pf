import type { SuccessData } from '@/store/transactionFormStore';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SuccessState } from './SuccessState';

afterEach(() => cleanup());

const baseData: SuccessData = {
  amount: '₹500',
  merchant: 'BigBasket',
  type: 'EXPENSE',
  date: '19 Jul',
  method: 'UPI',
  budgetPeriodLabel: 'Jul 2026 budget',
};

describe('SuccessState', () => {
  it('shows the singular heading for a single transaction', () => {
    render(<SuccessState data={baseData} onLogAnother={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Transaction logged!')).toBeInTheDocument();
  });

  it('does not render an itemized breakdown for a single transaction', () => {
    render(<SuccessState data={baseData} onLogAnother={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('Items logged')).not.toBeInTheDocument();
  });

  it('shows the plural heading and itemized breakdown for a bulk-logged bill', () => {
    const bulkData: SuccessData = {
      ...baseData,
      merchant: 'Sri Ganesh Grocers · 2 items',
      amount: '₹1,189',
      items: [
        { label: 'Meat', amount: '₹805' },
        { label: 'Milk', amount: '₹384' },
      ],
    };
    render(<SuccessState data={bulkData} onLogAnother={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Items logged!')).toBeInTheDocument();
    expect(screen.getByText('Items logged')).toBeInTheDocument();
    expect(screen.getByText('Meat')).toBeInTheDocument();
    expect(screen.getByText('₹805')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('₹384')).toBeInTheDocument();
  });

  it('shows the same plural heading for a bulk sinking deposit, not an expense-specific one', () => {
    const bulkSinking: SuccessData = {
      ...baseData,
      type: 'SINKING_DEPOSIT',
      merchant: 'Sinking · 2 items',
      amount: '₹6,000',
      items: [
        { label: 'EB (Electricity)', amount: '₹5,000' },
        { label: 'Internet', amount: '₹1,000' },
      ],
    };
    render(<SuccessState data={bulkSinking} onLogAnother={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Items logged!')).toBeInTheDocument();
  });

  it('keeps the singular heading when a bulk bill only had one item', () => {
    const oneItemBulk: SuccessData = {
      ...baseData,
      items: [{ label: 'Meat', amount: '₹805' }],
    };
    render(<SuccessState data={oneItemBulk} onLogAnother={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Transaction logged!')).toBeInTheDocument();
  });
});
