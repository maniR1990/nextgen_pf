import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountFormWizard } from './AccountFormWizard';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';

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
    accounts: [],
  },
];

describe('AccountFormWizard', () => {
  it('renders step 1 (Select Type) when opened', () => {
    render(
      <AccountFormWizard
        open
        onClose={vi.fn()}
        accountGroups={mockGroups}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Select Type')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('advances to step 2 after selecting a type', async () => {
    const user = userEvent.setup();
    render(
      <AccountFormWizard
        open
        onClose={vi.fn()}
        accountGroups={mockGroups}
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Savings Account/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AccountFormWizard
        open
        onClose={onClose}
        accountGroups={mockGroups}
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
