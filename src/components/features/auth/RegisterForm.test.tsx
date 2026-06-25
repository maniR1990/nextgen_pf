import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('requires terms acceptance before submit', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Full name'), 'Alice Johnson');
    await userEvent.type(screen.getByLabelText('Email address'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Terms and Privacy Policy');
  });

  it('shows password strength meter while typing', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    expect(screen.getByRole('progressbar', { name: 'Password strength' })).toBeInTheDocument();
  });
});
