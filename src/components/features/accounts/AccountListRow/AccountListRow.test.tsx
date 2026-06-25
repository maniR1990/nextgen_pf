import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountListRow } from './AccountListRow';
import type { AccountSummary } from '@/modules/accounts/accounts.types';

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
});
