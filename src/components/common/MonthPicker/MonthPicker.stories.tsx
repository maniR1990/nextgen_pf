import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { MonthPicker } from './MonthPicker';

const chromatic = { chromatic: { disableSnapshot: false } };

const meta: Meta<typeof MonthPicker> = {
  title: 'Common/MonthPicker',
  component: MonthPicker,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...chromatic },
  args: { label: 'Budget month' },
};

export default meta;
type Story = StoryObj<typeof MonthPicker>;

export const Playground: Story = {
  render: (args) => {
    const [val, setVal] = useState<{ month: number; year: number } | null>(null);
    return <MonthPicker {...args} value={val} onChange={setVal} />;
  },
};

export const WithValue: Story = {
  args: { value: { month: 6, year: 2026 }, onChange: fn() },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<{ month: number; year: number } | null>({ month: 6, year: 2026 });
    return <MonthPicker label="Budget month" value={val} onChange={setVal} />;
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<{ month: number; year: number } | null>(null);
    return <MonthPicker label="Budget month" value={val} onChange={setVal} />;
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
    const [val, setVal] = useState<{ month: number; year: number } | null>({ month: 6, year: 2026 });
    return <MonthPicker label="Budget month" value={val} onChange={setVal} />;
  },
};

export const ClickMonth: Story = {
  args: { onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const jun = canvas.getByRole('button', { name: /jun/i });
    await userEvent.click(jun);
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};
