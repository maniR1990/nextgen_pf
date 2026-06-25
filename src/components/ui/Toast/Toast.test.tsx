import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toast, toastClassName } from './Toast';

expect.extend(toHaveNoViolations);

describe('Toast', () => {
  afterEach(() => cleanup());

  it('renders title and description', () => {
    render(
      <Toast
        variant="success"
        title="Payment successful"
        description="$150 transferred to savings account."
      />,
    );
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
    expect(screen.getByText('$150 transferred to savings account.')).toBeInTheDocument();
  });

  it('uses alert role for error variant', () => {
    render(<Toast variant="error" title="Transaction failed" description="Insufficient funds." />);
    expect(screen.getByRole('alert')).toHaveClass('toast--error');
  });

  it('uses status role for success variant', () => {
    render(<Toast variant="success" title="Payment successful" />);
    expect(screen.getByRole('status')).toHaveClass('toast--success');
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<Toast variant="info" title="Update" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('applies variant class', () => {
    expect(toastClassName({ variant: 'warning' })).toContain('toast--warning');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(
      <Toast variant="info" title="New feature" description="Try the dashboard." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
