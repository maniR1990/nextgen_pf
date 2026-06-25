import { AppIcons, Icon } from '@/components/ui/Icon';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Nav, type NavItem } from './Nav';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Icon icon={AppIcons.home} size="md" /> },
  { id: 'transactions', label: 'Transactions', icon: <Icon icon={AppIcons.card} size="md" /> },
  { id: 'reports', label: 'Reports', icon: <Icon icon={AppIcons.chart} size="md" /> },
];

function StoryPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        width: '100%',
        maxWidth: 'calc(28 * var(--space-4))',
      }}
    >
      {children}
    </div>
  );
}

function NavDemo({ orientation = 'vertical' as const }) {
  const [activeId, setActiveId] = useState('dashboard');
  return (
    <Nav items={NAV_ITEMS} activeId={activeId} onSelect={setActiveId} orientation={orientation} />
  );
}

const meta: Meta<typeof Nav> = {
  title: 'UI/Nav',
  component: Nav,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Nav>;

export const Playground: Story = {
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
};

/** Chromatic baseline — vertical sidebar menu */
export const Vertical: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
};

export const Horizontal: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <NavDemo orientation="horizontal" />
    </StoryPanel>
  ),
};

export const WithDisabled: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <Nav
        items={[
          ...NAV_ITEMS.slice(0, 2),
          {
            id: 'reports',
            label: 'Reports',
            icon: <Icon icon={AppIcons.chart} size="md" />,
            disabled: true,
          },
        ]}
        activeId="dashboard"
      />
    </StoryPanel>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
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
  render: () => (
    <StoryPanel>
      <NavDemo />
    </StoryPanel>
  ),
};
