import type { Meta, StoryObj } from '@storybook/react';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
} from '@/components/ui/storyLayout';
import { TIMELINE_DENSITY } from '@/constants/timeline';
import { Timeline } from './Timeline';
import auditSample from './samples/audit.timeline.json';
import milestoneSample from './samples/milestone.timeline.json';
import transactionSample from './samples/transaction.timeline.json';
import { TimelineConfigSchema } from './schemas';

const transactionConfig = TimelineConfigSchema.parse(transactionSample);
const milestoneConfig = TimelineConfigSchema.parse(milestoneSample);
const auditConfig = TimelineConfigSchema.parse(auditSample);

const meta: Meta<typeof Timeline> = {
  title: 'UI/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        ...storySectionStyle,
        maxWidth: 'calc(40 * var(--space-4))',
        padding: 'var(--space-4)',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg)',
        border: 'var(--border-width) solid var(--color-border)',
      }}
    >
      {children}
    </div>
  );
}

export const Transaction: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <Panel>
      <Timeline config={transactionConfig} />
    </Panel>
  ),
};

export const Milestone: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <Panel>
      <Timeline config={milestoneConfig} />
    </Panel>
  ),
};

export const Audit: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <Panel>
      <Timeline config={auditConfig} />
    </Panel>
  ),
};

export const Compact: Story = {
  render: () => (
    <Panel>
      <Timeline config={transactionConfig} density={TIMELINE_DENSITY.COMPACT} />
    </Panel>
  ),
};

export const AllVariants: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div
      data-theme="dark"
      style={{
        ...storySectionStyle,
        display: 'grid',
        gap: 'var(--space-6)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(calc(34 * var(--space-4)), 1fr))',
        background: 'var(--color-bg)',
        padding: 'var(--space-4)',
      }}
    >
      <Panel>
        <Timeline config={transactionConfig} density={TIMELINE_DENSITY.COMPACT} />
      </Panel>
      <Panel>
        <Timeline config={milestoneConfig} density={TIMELINE_DENSITY.COMPACT} />
      </Panel>
      <Panel>
        <Timeline config={auditConfig} density={TIMELINE_DENSITY.COMPACT} />
      </Panel>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <Panel>
      <Timeline config={transactionConfig} density={TIMELINE_DENSITY.COMPACT} />
    </Panel>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <Panel>
      <Timeline config={auditConfig} />
    </Panel>
  ),
};
