import type { FundSummary } from '@/modules/funds/funds.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FundCard } from './FundCard';

const mockFund: FundSummary = {
  id: 'fund-1',
  name: 'Emergency Fund',
  purpose: 'EMERGENCY',
  targetAmount: 300000,
  targetMonths: null,
  currentAmount: 180000,
  percentFilled: 60,
  sources: [],
  categoryId: 'cat-1',
  goalId: null,
  color: '#4f9cf9',
  icon: null,
  order: 0,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FundCard', () => {
  it('renders fund name', () => {
    render(<FundCard fund={mockFund} />);
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('shows progress ring', () => {
    render(<FundCard fund={mockFund} />);
    expect(screen.getByRole('img', { name: /Emergency Fund/i })).toBeInTheDocument();
  });

  it('shows target amount', () => {
    render(<FundCard fund={mockFund} />);
    expect(screen.getByText(/3,00,000/)).toBeInTheDocument();
  });

  it('fires onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<FundCard fund={mockFund} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockFund);
  });
});
