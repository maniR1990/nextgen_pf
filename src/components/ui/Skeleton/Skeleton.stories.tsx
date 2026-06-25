import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonCard } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Primitives: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      <Skeleton variant="circle" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          flex: 1,
          minWidth: 200,
        }}
      >
        <Skeleton variant="text" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="rect" height={32} />
      </div>
    </div>
  ),
};

/** Chromatic baseline — card loading layout */
export const Card: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ width: '100%', maxWidth: 'calc(32 * var(--space-4))' }}>
      <SkeletonCard />
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <SkeletonCard />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <SkeletonCard />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <SkeletonCard />,
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
  render: () => <SkeletonCard />,
};
