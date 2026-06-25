import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MonthCalendar } from './MonthCalendar';
import type { CalendarTransaction } from './MonthCalendar';

const chromatic = { chromatic: { disableSnapshot: false } };

const SAMPLE_TXS: Record<string, CalendarTransaction[]> = {
  '2026-06-05': [
    { id: '1', merchant: 'Zepto', amount: 890, type: 'debit' },
    { id: '2', merchant: 'Salary', amount: 85000, type: 'credit' },
  ],
  '2026-06-10': [{ id: '3', merchant: 'Netflix', amount: 649, type: 'debit' }],
  '2026-06-13': [
    { id: '4', merchant: 'Swiggy', amount: 320, type: 'debit' },
    { id: '5', merchant: 'Refund', amount: 120, type: 'credit' },
    { id: '6', merchant: 'Transfer', amount: 5000, type: 'neutral' },
  ],
  '2026-06-20': [{ id: '7', merchant: 'Rent', amount: 25000, type: 'debit' }],
};

const meta: Meta<typeof MonthCalendar> = {
  title: 'Common/MonthCalendar',
  component: MonthCalendar,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { month: 6, year: 2026, transactions: SAMPLE_TXS },
};

export default meta;
type Story = StoryObj<typeof MonthCalendar>;

export const Playground: Story = {
  render: (args) => {
    const [sel, setSel] = useState<string | null>(null);
    return <MonthCalendar {...args} selectedDate={sel} onDayClick={setSel} />;
  },
};

export const WithSelectedDay: Story = {
  args: { selectedDate: '2026-06-13', onDayClick: fn() },
};

export const Empty: Story = {
  args: { transactions: {} },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [sel, setSel] = useState<string | null>(null);
    return (
      <MonthCalendar
        month={6}
        year={2026}
        transactions={SAMPLE_TXS}
        selectedDate={sel}
        onDayClick={setSel}
      />
    );
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [sel, setSel] = useState<string | null>(null);
    return (
      <MonthCalendar
        month={6}
        year={2026}
        transactions={SAMPLE_TXS}
        selectedDate={sel}
        onDayClick={setSel}
      />
    );
  },
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
  render: () => {
    const [sel, setSel] = useState<string | null>(null);
    return (
      <MonthCalendar
        month={6}
        year={2026}
        transactions={SAMPLE_TXS}
        selectedDate={sel}
        onDayClick={setSel}
      />
    );
  },
};

export const ClickDay: Story = {
  args: { onDayClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dayBtns = canvas
      .getAllByRole('button')
      .filter(
        (b) =>
          b.classList.contains('month-cal__day') && !b.classList.contains('month-cal__day--empty'),
      );
    if (dayBtns.length > 0) {
      await userEvent.click(dayBtns[0]);
      await expect(args.onDayClick).toHaveBeenCalledOnce();
    }
  },
};
