import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { BudgetLedger } from './BudgetLedger';
import samplePayload from './sampleBudgetLedger.json';
import { BudgetLedgerPayloadSchema } from './schemas';

const parsed = BudgetLedgerPayloadSchema.parse(samplePayload);

const meta: Meta<typeof BudgetLedger> = {
  title: 'UI/Budget Ledger',
  component: BudgetLedger,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof BudgetLedger>;

export const Default: Story = {
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: '100%', padding: 0 }}>
      <BudgetLedger payload={parsed} />
    </div>
  ),
};

export const Editable: Story = {
  render: () => (
    <BudgetLedger
      payload={parsed}
      editable
      onCreateLine={async () => {}}
      onUpdateLine={async () => {}}
      onDeleteLine={async () => {}}
    />
  ),
};

export const Compact: Story = {
  render: () => <BudgetLedger payload={parsed} density="compact" />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <div style={{ ...storySectionStyle, padding: 'var(--space-3)' }}>
      <BudgetLedger payload={parsed} density="compact" />
    </div>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <div style={{ ...storySectionStyle, padding: 'var(--space-4)' }}>
      <BudgetLedger payload={parsed} />
    </div>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(90 * var(--space-4))', padding: 0 }}>
      <BudgetLedger payload={parsed} />
    </div>
  ),
};
