import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  afterEach(() => cleanup());

  it('renders as switch', () => {
    render(<Toggle label="Notifications" />);
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('fires onChange when toggled', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Dark mode" onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));
    expect(onChange).toHaveBeenCalled();
  });
});
