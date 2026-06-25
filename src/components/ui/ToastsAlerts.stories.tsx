import { Toast } from '@/components/ui/Toast';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/Toasts & Alerts',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Toast and alert notifications with Lucide icons.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function OverviewPanel() {
  return (
    <div
      style={{
        ...storySectionStyle,
        maxWidth: 'calc(40 * var(--space-4))',
        padding: 'var(--space-6)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
      }}
    >
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
    </div>
  );
}

/** Chromatic baseline — spec board */
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
      <div data-theme="dark">
        <Story />
      </div>
    ),
  ],
  render: () => <OverviewPanel />,
};
