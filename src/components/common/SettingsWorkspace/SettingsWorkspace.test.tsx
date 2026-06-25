import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsWorkspace } from './SettingsWorkspace';
import { SettingsPageConfigSchema } from './schemas';

expect.extend(toHaveNoViolations);

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

const config = SettingsPageConfigSchema.parse({
  defaultTabId: 'accounts',
  tabs: [
    {
      id: 'accounts',
      label: 'Accounts',
      panel: {
        type: 'hierarchy',
        hierarchy: {
          variant: 'account',
          title: 'Account Groups',
          defaultExpandedIds: ['banking'],
          nodes: [
            {
              id: 'banking',
              name: 'Banking',
              level: 0,
              type: 'asset',
              children: [{ id: 'hdfc', name: 'HDFC Savings', level: 1 }],
            },
          ],
        },
      },
    },
    {
      id: 'categories',
      label: 'Categories',
      crud: true,
      panel: {
        type: 'hierarchy',
        hierarchy: {
          variant: 'category',
          title: 'Categories',
          defaultExpandedIds: ['income'],
          crudMode: 'inline',
          nodes: [
            {
              id: 'income',
              name: 'Income',
              level: 0,
              type: 'income',
              children: [{ id: 'salary', name: 'Salary', level: 1 }],
            },
          ],
        },
      },
    },
  ],
});

describe('SettingsWorkspace', () => {
  afterEach(() => {
    cleanup();
    mockSearchParams = new URLSearchParams();
  });

  it('renders default accounts panel without page header', () => {
    render(<SettingsWorkspace config={config} />);

    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account Groups' })).toBeInTheDocument();
    expect(screen.getByText('Banking')).toBeInTheDocument();
  });

  it('renders categories panel when tab query param is set', () => {
    mockSearchParams = new URLSearchParams('tab=categories');
    render(<SettingsWorkspace config={config} />);

    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.queryByText('Banking')).not.toBeInTheDocument();
  });

  it('forwards CRUD handlers on categories tab', () => {
    mockSearchParams = new URLSearchParams('tab=categories');
    const onCreate = vi.fn();
    render(<SettingsWorkspace config={config} onCreate={onCreate} />);

    screen.getByRole('button', { name: 'Add category Income' }).click();
    expect(onCreate).toHaveBeenCalledWith({
      parentId: 'income',
      parentLevel: 0,
      groupType: 'income',
    });
  });

  it('has no axe violations', async () => {
    const { container } = render(<SettingsWorkspace config={config} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
