import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chip, chipClassName } from './Chip';

expect.extend(toHaveNoViolations);

describe('Chip', () => {
  afterEach(() => cleanup());

  it('renders static chip as span when action is none', () => {
    render(<Chip>Static</Chip>);
    expect(screen.getByText('Static').closest('.chip')).not.toHaveAttribute('role', 'button');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders remove chip as button with aria-label', () => {
    render(<Chip action="remove">Category</Chip>);
    expect(screen.getByRole('button', { name: 'Remove Category' })).toBeInTheDocument();
  });

  it('renders add chip as button with aria-label', () => {
    render(<Chip action="add">Add filter</Chip>);
    expect(screen.getByRole('button', { name: 'Add filter' })).toBeInTheDocument();
  });

  it('calls onClick for interactive chips', async () => {
    const onClick = vi.fn();
    render(
      <Chip action="remove" onClick={onClick}>
        Category
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Category' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies variant and action classes', () => {
    expect(chipClassName({ variant: 'brand', action: 'remove' })).toContain('chip--brand');
    expect(chipClassName({ variant: 'success', action: 'remove' })).toContain('chip--remove');
    expect(chipClassName({ variant: 'neutral', action: 'add' })).toContain('chip--add');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(
      <Chip variant="brand" action="remove">
        Category
      </Chip>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
