import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransactionTable } from './TransactionTable';
import type { TransactionRow } from './TransactionTable';

afterEach(() => cleanup());

const ROWS: TransactionRow[] = [
  {
    id: '1',
    date: '2026-06-13',
    merchant: 'Zepto',
    amount: 890,
    amountSign: 'debit',
    category: 'Groceries',
    status: 'cleared',
  },
  {
    id: '2',
    date: '2026-06-12',
    merchant: 'HDFC Salary',
    amount: 85000,
    amountSign: 'credit',
    category: 'Income',
    status: 'cleared',
  },
  {
    id: '3',
    date: '2026-06-11',
    merchant: 'Swiggy',
    amount: 320,
    amountSign: 'debit',
    category: 'Dining',
    status: 'pending',
  },
  {
    id: '4',
    date: '2026-06-10',
    merchant: 'Old Charge',
    amount: 150,
    amountSign: 'debit',
    category: 'Misc',
    status: 'voided',
  },
];

describe('TransactionTable', () => {
  describe('rendering', () => {
    it('renders table with merchants', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.getAllByText('Zepto').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HDFC Salary').length).toBeGreaterThan(0);
    });

    it('shows debit amount with minus sign', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.getAllByText('−₹890').length).toBeGreaterThan(0);
    });

    it('shows credit amount with plus sign', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.getAllByText('+₹85,000').length).toBeGreaterThan(0);
    });

    it('shows pending status', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
    });

    it('shows voided status', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.getAllByText(/voided/i).length).toBeGreaterThan(0);
    });

    it('renders empty state when no rows', () => {
      render(<TransactionTable rows={[]} />);
      expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
    });

    it('renders loading skeletons when loading=true', () => {
      render(<TransactionTable rows={[]} loading />);
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('renders add button when onAdd is provided', () => {
      render(<TransactionTable rows={ROWS} onAdd={vi.fn()} />);
      expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
    });

    it('does not render add button when onAdd is not provided', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.queryByRole('button', { name: /add transaction/i })).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onEdit with row id', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<TransactionTable rows={ROWS} onEdit={onEdit} />);
      const editBtns = screen.getAllByRole('button', { name: /edit zepto/i });
      await user.click(editBtns[0]);
      expect(onEdit).toHaveBeenCalledWith('1');
    });

    it('calls onDelete with row id', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<TransactionTable rows={ROWS} onDelete={onDelete} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete zepto/i });
      await user.click(deleteBtns[0]);
      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('calls onAdd when add button clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<TransactionTable rows={ROWS} onAdd={onAdd} />);
      await user.click(screen.getByRole('button', { name: /add transaction/i }));
      expect(onAdd).toHaveBeenCalledOnce();
    });

    it('does not render edit/delete buttons when handlers not provided', () => {
      render(<TransactionTable rows={ROWS} />);
      expect(screen.queryByRole('button', { name: /edit zepto/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete zepto/i })).not.toBeInTheDocument();
    });
  });

  describe('custom title', () => {
    it('renders custom title', () => {
      render(<TransactionTable rows={ROWS} title="June Transactions" />);
      expect(screen.getByText('June Transactions')).toBeInTheDocument();
    });
  });
});
