import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountTypeGrid } from './AccountTypeGrid';

describe('AccountTypeGrid', () => {
  it('renders taxonomy group headings', () => {
    render(<AccountTypeGrid onSelect={vi.fn()} />);
    expect(screen.getByText('Banking')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
  });

  it('renders account type cards', () => {
    render(<AccountTypeGrid onSelect={vi.fn()} />);
    expect(screen.getByText('Savings Account')).toBeInTheDocument();
    expect(screen.getByText('Credit Card Outstanding')).toBeInTheDocument();
  });

  it('calls onSelect with type when a card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AccountTypeGrid onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Savings Account/i }));
    expect(onSelect).toHaveBeenCalledWith('BANK_SAVINGS');
  });

  it('highlights the selected type', () => {
    render(<AccountTypeGrid onSelect={vi.fn()} selected="BANK_SAVINGS" />);
    expect(screen.getByRole('button', { name: /Savings Account/i })).toHaveClass(
      'account-type-grid__card--selected',
    );
  });
});
