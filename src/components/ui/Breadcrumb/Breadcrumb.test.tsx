import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { Breadcrumb, breadcrumbClassName } from './Breadcrumb';

expect.extend(toHaveNoViolations);

describe('Breadcrumb', () => {
  afterEach(() => cleanup());

  it('renders trail with current page', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Transactions', href: '/transactions' },
          { label: 'Details', current: true },
        ]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
  });

  it('marks last item as current by default', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />);
    expect(screen.getByText('Settings')).toHaveAttribute('aria-current', 'page');
  });

  it('applies breadcrumb class', () => {
    expect(breadcrumbClassName()).toBe('breadcrumb');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Details' }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
