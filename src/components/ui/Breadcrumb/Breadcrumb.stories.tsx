import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const DEMO_ITEMS = [
  { label: 'Home', href: '#' },
  { label: 'Transactions', href: '#' },
  { label: 'Details', current: true },
];

function StoryPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        width: '100%',
        maxWidth: 'calc(40 * var(--space-4))',
      }}
    >
      {children}
    </div>
  );
}

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: { items: DEMO_ITEMS },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Playground: Story = {
  render: (args) => (
    <StoryPanel>
      <Breadcrumb {...args} />
    </StoryPanel>
  ),
};

/** Chromatic baseline — path with current page */
export const Default: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <Breadcrumb items={DEMO_ITEMS} />
    </StoryPanel>
  ),
};

export const TwoLevels: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <StoryPanel>
      <Breadcrumb
        items={[
          { label: 'Home', href: '#' },
          { label: 'Settings', current: true },
        ]}
      />
    </StoryPanel>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <StoryPanel>
      <Breadcrumb items={DEMO_ITEMS} />
    </StoryPanel>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <StoryPanel>
      <Breadcrumb items={DEMO_ITEMS} />
    </StoryPanel>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <StoryPanel>
      <Breadcrumb items={DEMO_ITEMS} />
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
      <Breadcrumb items={DEMO_ITEMS} />
    </StoryPanel>
  ),
};
