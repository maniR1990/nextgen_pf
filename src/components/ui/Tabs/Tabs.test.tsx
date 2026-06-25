import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tabs, tabsClassName } from './Tabs';

expect.extend(toHaveNoViolations);

const ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'reports', label: 'Reports' },
];

describe('Tabs', () => {
  afterEach(() => cleanup());

  it('renders tablist with active tab', () => {
    render(<Tabs items={ITEMS} value="overview" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
  });

  it('calls onChange when tab is clicked', async () => {
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="overview" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(onChange).toHaveBeenCalledWith('reports');
  });

  it('applies size class', () => {
    expect(tabsClassName({ size: 'sm' })).toContain('tabs--sm');
  });

  it('disables tab when disabled', () => {
    render(
      <Tabs
        items={[{ id: 'overview', label: 'Overview', disabled: true }]}
        value="overview"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeDisabled();
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Tabs items={ITEMS} value="overview" onChange={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
