import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { DataTable } from './DataTable';
import { TRANSACTION_COLUMNS, TRANSACTION_ROWS } from './sampleData';

const meta: Meta<typeof DataTable> = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component:
          'Enterprise data table with JSON column config, sorting, filtering, pagination, selection, and column preferences.',
      },
    },
  },
  args: {
    tableId: 'transactions-story',
    columns: TRANSACTION_COLUMNS,
    data: TRANSACTION_ROWS,
    persistPreferences: false,
    rowActions: [
      { id: 'view', label: 'View Details', onAction: fn() },
      { id: 'edit', label: 'Edit', onAction: fn() },
      { id: 'delete', label: 'Delete', onAction: fn(), destructive: true },
    ],
    bulkActions: [
      { id: 'export', label: 'Export', onAction: fn() },
      { id: 'delete', label: 'Delete', onAction: fn() },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  parameters: chromaticBaseline,
};

export const Loading: Story = {
  parameters: chromaticBaseline,
  args: { loading: true, data: [] },
};

export const Empty: Story = {
  parameters: chromaticBaseline,
  args: {
    data: [],
    emptyState: {
      title: 'No records found',
      description: 'Create a transaction to get started.',
      actionLabel: 'Create New',
      onAction: fn(),
    },
  },
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
