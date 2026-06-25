import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FundProgressRing } from './FundProgressRing';

describe('FundProgressRing', () => {
  it('renders accessible label with percent', () => {
    render(<FundProgressRing percent={60} label="Emergency" />);
    expect(screen.getByRole('img', { name: /Emergency/i })).toBeInTheDocument();
  });

  it('clamps percent to 100 for the bar fill', () => {
    const { container } = render(<FundProgressRing percent={150} label="Over" />);
    const bar = container.querySelector('.fund-progress-ring__bar');
    expect(bar).toBeInTheDocument();
  });

  it('shows percent text', () => {
    render(<FundProgressRing percent={45} label="Ops" />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });
});
