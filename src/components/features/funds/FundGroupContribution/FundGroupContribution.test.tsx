import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FundGroupContribution } from './FundGroupContribution';

describe('FundGroupContribution', () => {
  it('renders net contributed amount with INR formatting', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={120000}
        progressPct={45.8}
      />,
    );
    expect(screen.getByText(/55,000/)).toBeInTheDocument();
  });

  it('renders "Total Contributed" label', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={120000}
        progressPct={45.8}
      />,
    );
    expect(screen.getByText(/total contributed/i)).toBeInTheDocument();
  });

  it('renders progress bar with correct aria-valuenow', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={120000}
        progressPct={45.8}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '45.8');
  });

  it('shows target amount', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={120000}
        progressPct={45.8}
      />,
    );
    expect(screen.getByText(/1,20,000/)).toBeInTheDocument();
  });

  it('caps progress bar display at 100 when overcontributed', () => {
    render(
      <FundGroupContribution
        fundGroupName="Wealth"
        netContributed={200000}
        targetAmount={120000}
        progressPct={100}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(Number(bar.getAttribute('aria-valuemax'))).toBe(100);
  });

  it('renders zero state when no contributions yet', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={0}
        targetAmount={120000}
        progressPct={0}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('omits progress bar when targetAmount is null', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={null}
        progressPct={null}
      />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/55,000/)).toBeInTheDocument();
  });

  it('omits target amount line when targetAmount is null', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={null}
        progressPct={null}
      />,
    );
    expect(screen.queryByText(/of.*target/i)).not.toBeInTheDocument();
  });

  it('shows fund group name as accessible label', () => {
    render(
      <FundGroupContribution
        fundGroupName="Emergency"
        netContributed={55000}
        targetAmount={120000}
        progressPct={45.8}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toMatch(/emergency/i);
  });
});
