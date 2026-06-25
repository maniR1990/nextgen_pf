import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AllocationBar } from './AllocationBar';

const sources = [
  { accountName: 'HDFC Salary', allocatedAmount: 30000, accountBalance: 80000 },
  { accountName: 'SBI Savings', allocatedAmount: 20000, accountBalance: 40000 },
];

describe('AllocationBar', () => {
  it('renders source account names', () => {
    render(<AllocationBar sources={sources} totalTarget={50000} />);
    expect(screen.getByText('HDFC Salary')).toBeInTheDocument();
    expect(screen.getByText('SBI Savings')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<AllocationBar sources={sources} totalTarget={50000} />);
    expect(screen.getByRole('img', { name: /allocation breakdown/i })).toBeInTheDocument();
  });
});
