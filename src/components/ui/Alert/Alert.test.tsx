import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { Alert } from './Alert';

expect.extend(toHaveNoViolations);

describe('Alert', () => {
  afterEach(() => cleanup());

  it('renders error message with alert role', () => {
    render(<Alert variant="error">Invalid email or password.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('renders title and description together', () => {
    render(
      <Alert variant="success" title="Verification email sent successfully">
        Link expires in 24 hours.
      </Alert>,
    );
    expect(screen.getByText('Verification email sent successfully')).toBeInTheDocument();
    expect(screen.getByText('Link expires in 24 hours.')).toBeInTheDocument();
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Alert variant="warning">Please try again.</Alert>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
