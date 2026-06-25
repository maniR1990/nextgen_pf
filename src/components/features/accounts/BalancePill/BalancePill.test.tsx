import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalancePill } from './BalancePill';

describe('BalancePill', () => {
  it('renders positive amount in green', () => {
    render(<BalancePill amount={50000} />);
    const el = screen.getByTestId('balance-pill');
    expect(el).toHaveClass('balance-pill--positive');
    expect(el.textContent).toContain('50,000');
  });

  it('renders negative amount in red', () => {
    render(<BalancePill amount={-12000} />);
    const el = screen.getByTestId('balance-pill');
    expect(el).toHaveClass('balance-pill--negative');
    expect(el.textContent).toContain('12,000');
  });

  it('renders zero as neutral', () => {
    render(<BalancePill amount={0} />);
    const el = screen.getByTestId('balance-pill');
    expect(el).not.toHaveClass('balance-pill--positive');
    expect(el).not.toHaveClass('balance-pill--negative');
  });
});
