import type { AccountSummary } from '@/modules/accounts/accounts.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountListRow } from './AccountListRow';

const mockAccount: AccountSummary = {
  id: 'acc-1',
  name: 'HDFC Salary',
  code: 'SAL-001',
  type: 'BANK_SALARY',
  subtype: null,
  balance: 125000,
  currency: 'INR',
  status: 'ACTIVE',
  isPrimary: true,
  isDefaultExpenseAccount: false,
  isExcludeNetWorth: false,
  isHidden: false,
  institutionId: null,
  groupId: 'grp-1',
  archivedAt: null,
};

describe('AccountListRow', () => {
  it('renders account name and type badge', () => {
    render(<AccountListRow account={mockAccount} />);
    expect(screen.getByText('HDFC Salary')).toBeInTheDocument();
    expect(screen.getByText('Salary Account')).toBeInTheDocument();
  });

  it('shows formatted balance', () => {
    render(<AccountListRow account={mockAccount} />);
    expect(screen.getByTestId('balance-pill')).toBeInTheDocument();
  });

  it('fires onClick when row is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AccountListRow account={mockAccount} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /HDFC Salary/i }));
    expect(onClick).toHaveBeenCalledWith(mockAccount);
  });

  it('opens action menu on ··· button click', async () => {
    const user = userEvent.setup();
    render(<AccountListRow account={mockAccount} onEdit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  describe('default expense account', () => {
    it('shows no badge and offers "Set as default for expenses" when not the default', async () => {
      const user = userEvent.setup();
      const onSetDefaultExpense = vi.fn();
      render(
        <AccountListRow account={mockAccount} onSetDefaultExpense={onSetDefaultExpense} />,
      );
      expect(screen.queryByText('Default · Expense')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /more actions/i }));
      const item = screen.getByText('Set as default for expenses');
      expect(item).toBeInTheDocument();

      await user.click(item);
      expect(onSetDefaultExpense).toHaveBeenCalledWith(mockAccount);
    });

    it('shows a "Default · Expense" badge and hides the action when already the default', async () => {
      const user = userEvent.setup();
      const account = { ...mockAccount, isDefaultExpenseAccount: true };
      render(<AccountListRow account={account} onSetDefaultExpense={vi.fn()} />);

      expect(screen.getByText('Default · Expense')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /more actions/i }));
      expect(screen.queryByText('Set as default for expenses')).not.toBeInTheDocument();
    });
  });
});
