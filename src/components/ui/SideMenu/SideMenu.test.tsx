import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SideMenu } from './SideMenu';
import sampleConfig from './sampleSideMenu.json';
import { SideMenuConfigSchema } from './schemas';

expect.extend(toHaveNoViolations);

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

const config = SideMenuConfigSchema.parse(sampleConfig);

describe('SideMenu', () => {
  afterEach(() => cleanup());

  it('renders brand and JSON menu items', () => {
    render(<SideMenu config={config} activeId="dashboard" variant="standalone" />);

    expect(screen.getByText('PersonalFi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schema' })).toBeInTheDocument();
  });

  it('toggles collapsed state', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(
      <SideMenu
        config={config}
        defaultCollapsed={false}
        onCollapsedChange={onCollapsedChange}
        variant="standalone"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(document.querySelector('.side-menu--collapsed')).toBeInTheDocument();
  });

  it('is accessible', async () => {
    const { container } = render(
      <SideMenu config={config} activeId="dashboard" variant="standalone" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
