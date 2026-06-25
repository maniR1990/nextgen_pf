import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  afterEach(() => cleanup());

  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows strength label for a valid password', () => {
    render(<PasswordStrengthMeter password="Password1!" />);
    expect(screen.getByRole('progressbar', { name: 'Password strength' })).toBeInTheDocument();
    expect(screen.getByText(/Strong/)).toBeInTheDocument();
  });
});
