import { Badge } from '@/components/ui/Badge';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: string;
  status: 'completed' | 'pending';
};

const SAMPLE_DATA: Transaction[] = [
  {
    id: '1',
    date: '2026-06-01',
    description: 'Grocery Store',
    category: 'Food',
    amount: '-$84.20',
    status: 'completed',
  },
  {
    id: '2',
    date: '2026-06-03',
    description: 'Salary Deposit',
    category: 'Income',
    amount: '+$3,200.00',
    status: 'completed',
  },
  {
    id: '3',
    date: '2026-06-05',
    description: 'Electric Bill',
    category: 'Utilities',
    amount: '-$112.45',
    status: 'pending',
  },
];

const columns = [
  { key: 'date', header: 'Date', render: (row: Transaction) => row.date },
  { key: 'description', header: 'Description', render: (row: Transaction) => row.description },
  { key: 'category', header: 'Category', render: (row: Transaction) => row.category },
  {
    key: 'amount',
    header: 'Amount',
    render: (row: Transaction) => <span className="table__cell--amount">{row.amount}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: Transaction) => (
      <Badge variant={row.status === 'completed' ? 'success' : 'warning'}>{row.status}</Badge>
    ),
  },
];

const meta: Meta<typeof Table<Transaction>> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: {
    columns,
    data: SAMPLE_DATA,
    keyExtractor: (row) => row.id,
  },
};

export default meta;
type Story = StoryObj<typeof Table<Transaction>>;

export const Default: Story = {
  parameters: chromaticBaseline,
};

export const Empty: Story = {
  args: { data: [] },
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
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
};
