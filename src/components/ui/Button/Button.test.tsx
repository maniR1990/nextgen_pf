import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, buttonClassName } from './Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  afterEach(() => cleanup());

  it('renders label correctly', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows loading state with progressbar', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    expect(buttonClassName({ variant: 'danger' })).toContain('btn--danger');
    expect(buttonClassName({ variant: 'secondary' })).toContain('btn--secondary');
    expect(buttonClassName({ variant: 'success' })).toContain('btn--success');
    expect(buttonClassName({ variant: 'neutral' })).toContain('btn--neutral');
  });

  it('applies size and shape classes', () => {
    expect(buttonClassName({ size: 'icon' })).toContain('btn--icon');
    expect(buttonClassName({ shape: 'pill' })).toContain('btn--pill');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Button>Submit</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('icon-only button requires aria-label from consumer', () => {
    render(
      <Button size="icon" aria-label="Settings">
        <span>⚙</span>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });
});
