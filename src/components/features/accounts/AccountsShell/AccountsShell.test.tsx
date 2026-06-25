import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountsShell } from './AccountsShell';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import type { FundSummary, FundsAggregateSummary } from '@/modules/funds/funds.types';

const mockGroups: AccountGroupWithAccounts[] = [
  {
    id: 'grp-1',
    name: 'Banking',
    type: 'ASSET',
    slug: 'banking',
    order: 0,
    icon: null,
    color: null,
    isDefault: true,
    isCollapsed: false,
    accounts: [
      {
        id: 'acc-1',
        name: 'HDFC Salary',
        code: 'SAL-001',
        type: 'BANK_SALARY',
        subtype: null,
        balance: 100000,
        currency: 'INR',
        status: 'ACTIVE',
        isPrimary: true,
        isExcludeNetWorth: false,
        isHidden: false,
        institutionId: null,
        groupId: 'grp-1',
        archivedAt: null,
      },
    ],
  },
];

const mockFunds: FundSummary[] = [];
const mockSummary: FundsAggregateSummary = {
  totalAllocated: 0,
  totalUnallocated: 0,
  totalTarget: 0,
  overallFillPercent: 0,
  fundHealthRadar: [],
  currency: 'INR',
};

describe('AccountsShell', () => {
  it('renders Accounts tab by default', () => {
    render(
      <AccountsShell
        accountGroups={mockGroups}
        funds={mockFunds}
        fundsSummary={mockSummary}
        onCreateAccount={vi.fn()}
        onCreateFund={vi.fn()}
      />,
    );
    expect(screen.getByRole('tab', { name: /accounts/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows NetWorthBanner on Accounts tab', () => {
    render(
      <AccountsShell
        accountGroups={mockGroups}
        funds={mockFunds}
        fundsSummary={mockSummary}
        onCreateAccount={vi.fn()}
        onCreateFund={vi.fn()}
      />,
    );
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
  });

  it('switches to Funds tab on click', async () => {
    const user = userEvent.setup();
    render(
      <AccountsShell
        accountGroups={mockGroups}
        funds={mockFunds}
        fundsSummary={mockSummary}
        onCreateAccount={vi.fn()}
        onCreateFund={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('tab', { name: /funds/i }));
    expect(screen.getByRole('tab', { name: /funds/i })).toHaveAttribute('aria-selected', 'true');
  });
});
