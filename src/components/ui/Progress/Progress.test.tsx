import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Progress, progressClassName } from './Progress';

describe('Progress', () => {
  afterEach(() => cleanup());

  it('renders label and percentage', () => {
    render(<Progress label="Savings Goal" value={78} variant="success" />);
    expect(screen.getByText('Savings Goal')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('exposes progressbar semantics', () => {
    render(<Progress label="Profile Complete" value={60} />);
    expect(screen.getByRole('progressbar', { name: 'Profile Complete' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
  });

  it('auto-applies error variant when over max', () => {
    render(<Progress label="Budget Used" value={105} />);
    expect(screen.getByRole('progressbar')).toHaveClass('progress--error');
  });

  it('applies variant class', () => {
    expect(progressClassName({ variant: 'success' })).toContain('progress--success');
  });
});
