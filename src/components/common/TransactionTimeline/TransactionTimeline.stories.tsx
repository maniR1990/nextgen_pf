import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TransactionTimeline } from './TransactionTimeline';
import type { TimelineGroup } from './TransactionTimeline';

const chromatic = { chromatic: { disableSnapshot: false } };

const SAMPLE_GROUPS: TimelineGroup[] = [
  {
    date: '2026-06-13',
    transactions: [
      { id: '1', merchant: 'Zepto', category: 'Groceries', method: 'UPI', amount: 890, type: 'debit', tags: ['Essential'] },
      { id: '2', merchant: 'HDFC Salary', category: 'Income', method: 'NEFT', amount: 85000, type: 'credit' },
    ],
  },
  {
    date: '2026-06-12',
    transactions: [
      { id: '3', merchant: 'Netflix', category: 'Entertainment', method: 'Card', amount: 649, type: 'debit' },
      { id: '4', merchant: 'Swiggy', category: 'Dining', method: 'UPI', amount: 320, type: 'debit' },
    ],
  },
  {
    date: '2026-06-10',
    transactions: [
      { id: '5', merchant: 'Rent', category: 'Housing', method: 'NEFT', amount: 25000, type: 'debit' },
    ],
  },
];

const meta: Meta<typeof TransactionTimeline> = {
  title: 'Common/TransactionTimeline',
  component: TransactionTimeline,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { groups: SAMPLE_GROUPS },
};

export default meta;
type Story = StoryObj<typeof TransactionTimeline>;

export const Playground: Story = {
  args: { onTransactionClick: fn() },
};

export const WithSummary: Story = {
  args: { showSummary: true, onTransactionClick: fn() },
};

export const Loading: Story = {
  args: { groups: [], loading: true },
};

export const Empty: Story = {
  args: { groups: [] },
};

export const WithLoadMore: Story = {
  args: { hasMore: true, onLoadMore: fn(), onTransactionClick: fn() },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  args: { onTransactionClick: fn() },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  args: { onTransactionClick: fn() },
};

export const DarkMode: Story = {
  parameters: { ...chromatic, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)' }}>
        <Story />
      </div>
    ),
  ],
};

export const FilterTabInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const incomeTab = canvas.getByRole('tab', { name: /income/i });
    await userEvent.click(incomeTab);
    await expect(incomeTab).toHaveAttribute('aria-selected', 'true');
  },
};

export const TransactionClickInteraction: Story = {
  args: { onTransactionClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /zepto/i });
    await userEvent.click(card);
    await expect(args.onTransactionClick).toHaveBeenCalledWith('1');
  },
};

export const LoadMoreInteraction: Story = {
  args: { hasMore: true, onLoadMore: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: /load more/i });
    await userEvent.click(btn);
    await expect(args.onLoadMore).toHaveBeenCalledOnce();
  },
};
