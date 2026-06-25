import { Card } from '@/components/ui/Card';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import {
  EMPTY_STATE_DEMO_TRANSACTIONS_ACTION,
  EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION,
  EMPTY_STATE_DEMO_TRANSACTIONS_TITLE,
} from '@/constants/emptyState';
import type { Meta, StoryObj } from '@storybook/react';
import { Mailbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Centered empty placeholder with icon, title, optional description, and CTA.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

function StoryPanel({ children }: { children: ReactNode }) {
  return <Card>{children}</Card>;
}

function DefaultEmptyState() {
  return (
    <StoryPanel>
      <EmptyState
        icon={Mailbox}
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        actionLabel={EMPTY_STATE_DEMO_TRANSACTIONS_ACTION}
        onAction={fn()}
      />
    </StoryPanel>
  );
}

export const Default: Story = {
  render: () => <DefaultEmptyState />,
};

export const NoAction: Story = {
  render: () => (
    <StoryPanel>
      <EmptyState
        icon={Mailbox}
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
      />
    </StoryPanel>
  ),
};

function SizeShowcase() {
  return (
    <div style={storySectionStyle}>
      <StoryPanel>
        <EmptyState
          size="sm"
          icon={Mailbox}
          title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
          description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        />
      </StoryPanel>
      <StoryPanel>
        <EmptyState
          size="md"
          icon={Mailbox}
          title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
          description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        />
      </StoryPanel>
      <StoryPanel>
        <EmptyState
          size="lg"
          icon={Mailbox}
          title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
          description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        />
      </StoryPanel>
    </div>
  );
}

export const Sizes: Story = {
  render: () => <SizeShowcase />,
};

/** Chromatic baseline — default, no action, and size variants */
export const ChromaticBaseline: Story = {
  name: 'Chromatic Baseline',
  parameters: chromaticBaseline,
  render: () => (
    <div style={storySectionStyle}>
      <StoryPanel>
        <EmptyState
          icon={Mailbox}
          title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
          description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
          actionLabel={EMPTY_STATE_DEMO_TRANSACTIONS_ACTION}
          onAction={fn()}
        />
      </StoryPanel>
      <StoryPanel>
        <EmptyState
          icon={Mailbox}
          title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
          description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        />
      </StoryPanel>
      <SizeShowcase />
    </div>
  ),
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
  render: () => (
    <StoryPanel>
      <EmptyState
        icon={Mailbox}
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        actionLabel={EMPTY_STATE_DEMO_TRANSACTIONS_ACTION}
        onAction={fn()}
      />
    </StoryPanel>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <DefaultEmptyState />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <DefaultEmptyState />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <DefaultEmptyState />,
};
