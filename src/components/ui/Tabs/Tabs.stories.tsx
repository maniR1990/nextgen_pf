import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { type TabItem, Tabs } from './Tabs';

const TAB_ITEMS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

function StoryPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

function TabsDemo({ size, initial = 'overview' }: { size?: 'sm' | 'md'; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <Tabs items={TAB_ITEMS} value={value} onChange={setValue} size={size} />;
}

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Playground: Story = {
  render: () => (
    <StoryPanel>
      <TabsDemo />
    </StoryPanel>
  ),
};

/** Chromatic baseline — segmented control */
export const Default: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <TabsDemo />
    </StoryPanel>
  ),
};

export const Small: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <TabsDemo size="sm" />
    </StoryPanel>
  ),
};

export const WithDisabled: Story = {
  parameters: chromaticBaseline,
  render: () => {
    const items: TabItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'transactions', label: 'Transactions', disabled: true },
      { id: 'reports', label: 'Reports' },
    ];
    return (
      <StoryPanel>
        <Tabs items={items} value="overview" onChange={() => undefined} />
      </StoryPanel>
    );
  },
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <StoryPanel>
      <TabsDemo />
    </StoryPanel>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <StoryPanel>
      <TabsDemo />
    </StoryPanel>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <StoryPanel>
      <TabsDemo />
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
      <TabsDemo />
    </StoryPanel>
  ),
};
