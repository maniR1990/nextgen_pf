import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AppIcons, Icon } from '@/components/ui/Icon';
import { Nav } from '@/components/ui/Nav';
import { Tabs } from '@/components/ui/Tabs';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';

const meta: Meta = {
  title: 'UI/Navigation',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Breadcrumb, horizontal tabs, and vertical navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

function NavigationBoard() {
  const [tab, setTab] = useState('overview');
  const [nav, setNav] = useState('dashboard');

  return (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(48 * var(--space-4))', padding: 0 }}>
      <Panel>
        <Breadcrumb
          items={[
            { label: 'Home', href: '#' },
            { label: 'Transactions', href: '#' },
            { label: 'Details', current: true },
          ]}
        />
      </Panel>

      <Panel>
        <Tabs
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'reports', label: 'Reports' },
            { id: 'settings', label: 'Settings' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Panel>

      <Panel>
        <Nav
          items={[
            { id: 'dashboard', label: 'Dashboard', icon: <Icon icon={AppIcons.home} size="md" /> },
            { id: 'transactions', label: 'Transactions', icon: <Icon icon={AppIcons.card} size="md" /> },
            { id: 'reports', label: 'Reports', icon: <Icon icon={AppIcons.chart} size="md" /> },
          ]}
          activeId={nav}
          onSelect={setNav}
        />
      </Panel>
    </div>
  );
}

/** Chromatic baseline — navigation spec board */
export const Overview: Story = {
  parameters: chromaticBaseline,
  render: () => <NavigationBoard />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <NavigationBoard />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <NavigationBoard />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <NavigationBoard />,
};

export const DarkMode: Story = {
  parameters: chromaticBaseline,
  decorators: [
    (Story) => (
      <div data-theme="dark" style={storySectionStyle}>
        <Story />
      </div>
    ),
  ],
  render: () => <NavigationBoard />,
};
