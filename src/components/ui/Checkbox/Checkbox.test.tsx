import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  afterEach(() => cleanup());

  it('renders and toggles', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Agree" onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Agree' }));
    expect(onChange).toHaveBeenCalled();
  });

  it('supports indeterminate state', () => {
    render(<Checkbox label="Select all" indeterminate defaultChecked />);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toHaveProperty(
      'indeterminate',
      true,
    );
  });
});
