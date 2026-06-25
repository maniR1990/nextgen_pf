import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountGroupSection } from './AccountGroupSection';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';

const mockGroup: AccountGroupWithAccounts = {
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
      balance: 50000,
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
};

describe('AccountGroupSection', () => {
  it('renders group name', () => {
    render(<AccountGroupSection group={mockGroup} />);
    expect(screen.getByText('Banking')).toBeInTheDocument();
  });

  it('shows account rows', () => {
    render(<AccountGroupSection group={mockGroup} />);
    expect(screen.getByText('HDFC Salary')).toBeInTheDocument();
  });

  it('collapses on header click', async () => {
    const user = userEvent.setup();
    render(<AccountGroupSection group={mockGroup} />);
    await user.click(screen.getByRole('button', { name: /banking/i }));
    expect(screen.queryByText('HDFC Salary')).not.toBeInTheDocument();
  });

  it('shows add account button', () => {
    render(<AccountGroupSection group={mockGroup} onAddAccount={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
  });
});
