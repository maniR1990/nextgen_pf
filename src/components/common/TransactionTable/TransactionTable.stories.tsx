import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TransactionTable } from './TransactionTable';
import type { TransactionRow } from './TransactionTable';

const chromatic = { chromatic: { disableSnapshot: false } };

const ROWS: TransactionRow[] = [
  {
    id: '1',
    date: '2026-06-13',
    merchant: 'Zepto',
    amount: 890,
    amountSign: 'debit',
    category: 'Groceries',
    status: 'cleared',
  },
  {
    id: '2',
    date: '2026-06-12',
    merchant: 'HDFC Salary',
    amount: 85000,
    amountSign: 'credit',
    category: 'Income',
    status: 'cleared',
  },
  {
    id: '3',
    date: '2026-06-11',
    merchant: 'Netflix',
    amount: 649,
    amountSign: 'debit',
    category: 'Entertainment',
    status: 'cleared',
  },
  {
    id: '4',
    date: '2026-06-10',
    merchant: 'Rent',
    amount: 25000,
    amountSign: 'debit',
    category: 'Housing',
    status: 'cleared',
  },
  {
    id: '5',
    date: '2026-06-09',
    merchant: 'Swiggy',
    amount: 320,
    amountSign: 'debit',
    category: 'Dining',
    status: 'pending',
  },
  {
    id: '6',
    date: '2026-06-08',
    merchant: 'Old Charge',
    amount: 150,
    amountSign: 'debit',
    category: 'Misc',
    status: 'voided',
  },
  {
    id: '7',
    date: '2026-06-07',
    merchant: 'Amazon',
    amount: 1299,
    amountSign: 'debit',
    category: 'Shopping',
    status: 'cleared',
  },
  {
    id: '8',
    date: '2026-06-06',
    merchant: 'Reliance',
    amount: 2400,
    amountSign: 'debit',
    category: 'Groceries',
    status: 'cleared',
  },
  {
    id: '9',
    date: '2026-06-05',
    merchant: 'Freelance',
    amount: 15000,
    amountSign: 'credit',
    category: 'Income',
    status: 'cleared',
  },
  {
    id: '10',
    date: '2026-06-04',
    merchant: 'IRCTC',
    amount: 1800,
    amountSign: 'debit',
    category: 'Travel',
    status: 'cleared',
  },
  {
    id: '11',
    date: '2026-06-03',
    merchant: 'Gym',
    amount: 2500,
    amountSign: 'debit',
    category: 'Health',
    status: 'cleared',
  },
  {
    id: '12',
    date: '2026-06-02',
    merchant: 'Ola',
    amount: 450,
    amountSign: 'debit',
    category: 'Travel',
    status: 'cleared',
  },
];

const meta: Meta<typeof TransactionTable> = {
  title: 'Common/TransactionTable',
  component: TransactionTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { rows: ROWS, title: 'Transactions', onEdit: fn(), onDelete: fn(), onAdd: fn() },
};

export default meta;
type Story = StoryObj<typeof TransactionTable>;

export const Playground: Story = {};

export const WithPagination: Story = {
  args: { pageSize: 5 },
};

export const WithRowClick: Story = {
  args: { onRowClick: fn() },
};

export const Loading: Story = {
  args: { rows: [], loading: true },
};

export const Empty: Story = {
  args: { rows: [] },
};

export const ReadOnly: Story = {
  args: { onEdit: undefined, onDelete: undefined, onAdd: undefined },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
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

export const SortInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const merchantSort = canvas.getByRole('button', { name: /^merchant$/i });
    await userEvent.click(merchantSort);
    await expect(merchantSort.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  },
};

export const SearchInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole('textbox', { name: /search/i });
    await userEvent.type(searchInput, 'zepto');
    await expect(canvas.getAllByText(/zepto/i).length).toBeGreaterThan(0);
  },
};

export const EditInteraction: Story = {
  args: { onEdit: fn(), onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const editBtns = canvas.getAllByRole('button', { name: /edit zepto/i });
    await userEvent.click(editBtns[0]);
    await expect(args.onEdit).toHaveBeenCalledWith('1');
  },
};

export const DeleteInteraction: Story = {
  args: { onEdit: fn(), onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const deleteBtns = canvas.getAllByRole('button', { name: /delete zepto/i });
    await userEvent.click(deleteBtns[0]);
    await expect(args.onDelete).toHaveBeenCalledWith('1');
  },
};
