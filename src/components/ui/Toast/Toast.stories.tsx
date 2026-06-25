import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: {
    title: 'Payment successful',
    description: '$150 transferred to savings account.',
    variant: 'success',
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Playground: Story = {};

function ToastExamples() {
  return (
    <div className="toast-stack">
      <Toast
        variant="success"
        title="Payment successful"
        description="$150 transferred to savings account."
      />
      <Toast
        variant="error"
        title="Transaction failed"
        description="Insufficient funds. Please try again."
      />
      <Toast
        variant="warning"
        title="Budget exceeded"
        description="You've spent 105% of your dining budget."
      />
      <Toast
        variant="info"
        title="New feature available"
        description="Try the new AI insights dashboard."
      />
    </div>
  );
}

/** Chromatic baseline — all toast variants */
export const Variants: Story = {
  parameters: chromaticBaseline,
  render: () => <ToastExamples />,
};

export const Dismissible: Story = {
  parameters: chromaticBaseline,
  args: {
    variant: 'info',
    title: 'New feature available',
    description: 'Try the new AI insights dashboard.',
    onDismiss: fn(),
  },
};

export const TitleOnly: Story = {
  parameters: chromaticBaseline,
  args: {
    variant: 'success',
    title: 'Saved',
    description: undefined,
  },
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <ToastExamples />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <ToastExamples />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <ToastExamples />,
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
  render: () => <ToastExamples />,
};
