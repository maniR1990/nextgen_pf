import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Nav, navClassName } from './Nav';

expect.extend(toHaveNoViolations);

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <span aria-hidden>D</span> },
  { id: 'transactions', label: 'Transactions' },
  { id: 'reports', label: 'Reports' },
];

describe('Nav', () => {
  afterEach(() => cleanup());

  it('renders navigation with active item', () => {
    render(<Nav items={ITEMS} activeId="dashboard" />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('calls onSelect when item is clicked', async () => {
    const onSelect = vi.fn();
    render(<Nav items={ITEMS} activeId="dashboard" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));
    expect(onSelect).toHaveBeenCalledWith('reports');
  });

  it('renders anchor when href is provided', () => {
    render(
      <Nav
        items={[{ id: 'dashboard', label: 'Dashboard', href: '/dashboard' }]}
        activeId="dashboard"
      />,
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('applies orientation class', () => {
    expect(navClassName({ orientation: 'horizontal' })).toContain('nav--horizontal');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Nav items={ITEMS} activeId="dashboard" onSelect={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
