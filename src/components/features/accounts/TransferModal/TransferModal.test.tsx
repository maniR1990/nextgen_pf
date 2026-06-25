import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TransferModal } from './TransferModal';
import type { AccountSummary } from '@/modules/accounts/accounts.types';

const makeAccount = (id: string, name: string, balance: number): AccountSummary => ({
  id,
  name,
  code: `${id}-code`,
  type: 'BANK_SAVINGS',
  subtype: null,
  balance,
  currency: 'INR',
  status: 'ACTIVE',
  isPrimary: false,
  isExcludeNetWorth: false,
  isHidden: false,
  institutionId: null,
  groupId: 'grp-1',
  archivedAt: null,
});

const accounts = [makeAccount('a1', 'HDFC Salary', 100000), makeAccount('a2', 'SBI Savings', 50000)];

describe('TransferModal', () => {
  it('renders when open', () => {
    render(
      <TransferModal
        open
        onClose={vi.fn()}
        accounts={accounts}
        fromAccountId="a1"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Transfer/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TransferModal
        open={false}
        onClose={vi.fn()}
        accounts={accounts}
        fromAccountId="a1"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <TransferModal
        open
        onClose={onClose}
        accounts={accounts}
        fromAccountId="a1"
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
