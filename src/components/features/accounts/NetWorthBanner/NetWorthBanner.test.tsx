import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NetWorthBanner } from './NetWorthBanner';

describe('NetWorthBanner', () => {
  it('renders total assets, liabilities, and net worth', () => {
    render(<NetWorthBanner totalAssets={500000} totalLiabilities={120000} netWorth={380000} />);
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
  });

  it('renders three BalancePills', () => {
    render(<NetWorthBanner totalAssets={500000} totalLiabilities={120000} netWorth={380000} />);
    expect(screen.getAllByTestId('balance-pill')).toHaveLength(3);
  });
});
