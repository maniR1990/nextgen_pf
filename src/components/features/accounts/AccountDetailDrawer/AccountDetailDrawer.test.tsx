import type { AccountDetail } from '@/modules/accounts/accounts.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountDetailDrawer } from './AccountDetailDrawer';

const mockDetail: AccountDetail = {
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
  openingBalance: 0,
  balanceAsOf: null,
  accountNumber: null,
  ifscCode: null,
  upiId: null,
  creditLimit: null,
  billingCycle: null,
  interestRate: null,
  minimumPayment: null,
  investedAmount: null,
  currentValue: null,
  absoluteReturn: null,
  xirr: null,
  maturityDate: null,
  lockInMonths: null,
  expectedReturn: null,
  category80C: false,
  principalAmount: null,
  emi: null,
  remainingEmis: null,
  interestPaidTotal: null,
  fundAllocations: [],
  linkedAccounts: [],
  recentActivity: [],
  color: null,
  icon: null,
  note: null,
  tags: [],
  openedOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AccountDetailDrawer', () => {
  it('renders account name when open', () => {
    render(<AccountDetailDrawer open account={mockDetail} onClose={vi.fn()} />);
    expect(screen.getByText('HDFC Salary')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AccountDetailDrawer open={false} account={mockDetail} onClose={vi.fn()} />);
    expect(screen.queryByText('HDFC Salary')).not.toBeInTheDocument();
  });

  it('shows Overview tab by default', () => {
    render(<AccountDetailDrawer open account={mockDetail} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Settings tab on click', async () => {
    const user = userEvent.setup();
    render(<AccountDetailDrawer open account={mockDetail} onClose={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: /settings/i }));
    expect(screen.getByRole('tab', { name: /settings/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AccountDetailDrawer open account={mockDetail} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
