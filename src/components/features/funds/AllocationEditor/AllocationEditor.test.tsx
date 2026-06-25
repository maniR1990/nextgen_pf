import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AllocationEditor } from './AllocationEditor';
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

describe('AllocationEditor', () => {
  it('renders when open', () => {
    render(
      <AllocationEditor
        open
        onClose={vi.fn()}
        fundName="Emergency Fund"
        accountGroups={mockGroups}
        initialAllocations={[]}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Emergency Fund/i })).toBeInTheDocument();
  });

  it('lists accounts to pick from', () => {
    render(
      <AllocationEditor
        open
        onClose={vi.fn()}
        fundName="Emergency Fund"
        accountGroups={mockGroups}
        initialAllocations={[]}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getAllByText('HDFC Salary').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose on cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AllocationEditor
        open
        onClose={onClose}
        fundName="Emergency Fund"
        accountGroups={mockGroups}
        initialAllocations={[]}
        onSave={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('adds an account row and calls onSave with correct payload', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <AllocationEditor
        open
        onClose={onClose}
        fundName="Emergency Fund"
        accountGroups={mockGroups}
        initialAllocations={[]}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /\+ add/i }));

    const valueInput = screen.getByRole('spinbutton', { name: /hdfc salary allocation amount/i });
    await user.clear(valueInput);
    await user.type(valueInput, '10');

    await user.click(screen.getByRole('button', { name: /save allocations/i }));

    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({ accountId: 'acc-1', type: 'PERCENTAGE', value: 10 }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when onSave rejects', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(
      <AllocationEditor
        open
        onClose={vi.fn()}
        fundName="Emergency Fund"
        accountGroups={mockGroups}
        initialAllocations={[{ accountId: 'acc-1', type: 'PERCENTAGE', value: 10, priority: 0 }]}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /save allocations/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
  });
});
