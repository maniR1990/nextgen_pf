import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FundBucketBoard } from './FundBucketBoard';
import type { FundSummary } from '@/modules/funds/funds.types';

const makeFund = (id: string, name: string, purpose: string): FundSummary => ({
  id,
  name,
  purpose: purpose as FundSummary['purpose'],
  groupId: null,
  groupName: null,
  groupSlug: null,
  targetAmount: 100000,
  targetMonths: null,
  currentAmount: 50000,
  percentFilled: 50,
  sources: [],
  goalId: null,
  color: null,
  icon: null,
  order: 0,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('FundBucketBoard', () => {
  it('renders purpose tier headings when no groups provided', () => {
    render(
      <FundBucketBoard
        groups={[]}
        funds={[makeFund('f1', 'Emergency', 'EMERGENCY'), makeFund('f2', 'Ops', 'OPS')]}
        onCreateFund={vi.fn()}
      />,
    );
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('renders fund cards in fallback mode', () => {
    render(
      <FundBucketBoard
        groups={[]}
        funds={[makeFund('f1', 'My Emergency', 'EMERGENCY')]}
        onCreateFund={vi.fn()}
      />,
    );
    expect(screen.getByText('My Emergency')).toBeInTheDocument();
  });

  it('shows add fund button', () => {
    render(<FundBucketBoard groups={[]} funds={[]} onCreateFund={vi.fn()} />);
    expect(screen.getByRole('button', { name: /new fund/i })).toBeInTheDocument();
  });
});
