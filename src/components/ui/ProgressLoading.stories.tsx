import { Progress } from '@/components/ui/Progress';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/Progress & Loading',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Progress bars and skeleton loading states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function OverviewPanel() {
  return (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(40 * var(--space-4))', padding: 0 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          padding: 'var(--space-6)',
          border: 'var(--border-width) solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
        }}
      >
        <Progress label="Savings Goal" value={78} variant="success" />
        <Progress label="Budget Used" value={105} variant="error" />
        <Progress label="Profile Complete" value={60} variant="brand" />
      </div>
      <SkeletonCard />
    </div>
  );
}

/** Chromatic baseline — full spec board */
export const Overview: Story = {
  parameters: chromaticBaseline,
  render: () => <OverviewPanel />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <OverviewPanel />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <OverviewPanel />,
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
  render: () => <OverviewPanel />,
};
