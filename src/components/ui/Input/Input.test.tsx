import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { Input, inputClassName } from './Input';

expect.extend(toHaveNoViolations);

describe('Input', () => {
  afterEach(() => cleanup());

  it('renders label and associates with input', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows hint message', () => {
    render(<Input label="Email" hint="Helper text" />);
    expect(screen.getByText('Helper text').closest('.field-msg')).toHaveClass('field-msg--hint');
  });

  it('shows error message and aria-invalid', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email').closest('.field-msg')).toHaveClass('field-msg--error');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows success message', () => {
    render(<Input label="Email" success="Verified" />);
    expect(screen.getByText('Verified').closest('.field-msg')).toHaveClass('field-msg--success');
  });

  it('applies state classes', () => {
    expect(inputClassName({ error: 'x' })).toContain('input-field__control--error');
    expect(inputClassName({ success: 'ok' })).toContain('input-field__control--success');
  });

  it('is accessible', async () => {
    const { container } = render(<Input label="Name" hint="Your full name" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
