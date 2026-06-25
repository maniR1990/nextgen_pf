import type { Meta, StoryObj } from '@storybook/react';
import { TransactionTimelineTW, DEMO_GROUPS } from './TransactionTimelineTW';
import type { TimelineTxGroup } from './TransactionTimelineTW';

const meta: Meta<typeof TransactionTimelineTW> = {
  title: 'Common/TransactionTimelineTW',
  component: TransactionTimelineTW,
  parameters: { layout: 'padded' },
  args: { groups: DEMO_GROUPS },
};

export default meta;
type Story = StoryObj<typeof TransactionTimelineTW>;

// ── Default: full mock data ───────────────────────────────────────────────
export const Default: Story = {};

// ── With load-more button ─────────────────────────────────────────────────
export const WithLoadMore: Story = {
  args: {
    hasMore: true,
    onLoadMore: () => alert('Load more triggered'),
  },
};

// ── Single date group ─────────────────────────────────────────────────────
export const SingleGroup: Story = {
  args: {
    groups: [DEMO_GROUPS[0]],
  },
};

// ── Custom JSON input (one group, mixed types) ────────────────────────────
const CUSTOM_JSON: TimelineTxGroup[] = [
  {
    date: '2024-07-01',
    transactions: [
      { id: 'a', merchant: 'Zepto',       subtitle: 'Groceries · UPI',  amount: -540,   type: 'debit'  },
      { id: 'b', merchant: 'Freelance',   subtitle: 'Income · IMPS',    amount: 15000,  type: 'credit' },
    ],
  },
  {
    date: '2024-06-30',
    transactions: [
      { id: 'c', merchant: 'Netflix',     subtitle: 'OTT · Card',       amount: -649,   type: 'debit'  },
    ],
  },
];

export const CustomJSON: Story = {
  args: { groups: CUSTOM_JSON },
};

// ── Empty state ───────────────────────────────────────────────────────────
export const Empty: Story = {
  args: { groups: [] },
};
