import type { Meta, StoryObj } from '@storybook/react';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: {
    label: 'Savings Goal',
    value: 78,
    showValue: true,
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Playground: Story = {};

function ProgressExamples() {
  return (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(32 * var(--space-4))', padding: 0 }}>
      <Progress label="Savings Goal" value={78} variant="success" />
      <Progress label="Budget Used" value={105} variant="error" />
      <Progress label="Profile Complete" value={60} variant="brand" />
    </div>
  );
}

/** Chromatic baseline — matches progress spec */
export const Variants: Story = {
  parameters: chromaticBaseline,
  render: () => <ProgressExamples />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <ProgressExamples />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <ProgressExamples />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <ProgressExamples />,
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
  render: () => <ProgressExamples />,
};
