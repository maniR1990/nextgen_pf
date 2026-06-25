import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { DatePicker } from './DatePicker';

const chromatic = { chromatic: { disableSnapshot: false } };

const meta: Meta<typeof DatePicker> = {
  title: 'Common/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  argTypes: {
    mode: { control: 'radio', options: ['single', 'range'] },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
  },
  args: {
    placeholder: 'Select date',
    label: 'Date',
    mode: 'single',
    disabled: false,
    clearable: true,
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Playground: Story = {
  render: (args) => {
    const [val, setVal] = useState<string | null>(null);
    return <DatePicker {...args} value={val} onChange={setVal} />;
  },
};

export const WithValue: Story = {
  args: { value: '2026-06-13', label: 'Date', onChange: fn() },
};

export const RangeMode: Story = {
  render: () => {
    const [start, setStart] = useState<string | null>('2026-06-10');
    const [end, setEnd] = useState<string | null>('2026-06-20');
    return (
      <DatePicker
        mode="range"
        label="Date range"
        rangeStart={start}
        rangeEnd={end}
        onRangeChange={(s, e) => { setStart(s); setEnd(e); }}
      />
    );
  },
};

export const Clearable: Story = {
  args: { value: '2026-06-13', label: 'Date', clearable: true, onChange: fn() },
};

export const WithMinMax: Story = {
  args: {
    label: 'Date (Jun 2026 only)',
    minDate: '2026-06-01',
    maxDate: '2026-06-30',
    onChange: fn(),
  },
};

export const WithError: Story = {
  args: { label: 'Date', error: 'Date is required', onChange: fn() },
};

export const Disabled: Story = {
  args: { label: 'Date', value: '2026-06-13', disabled: true, onChange: fn() },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 320 }}>
        <DatePicker label="Select date" value={val} onChange={setVal} />
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: '100%' }}>
        <DatePicker label="Select date" value={val} onChange={setVal} />
      </div>
    );
  },
};

export const DarkMode: Story = {
  parameters: { ...chromatic, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)', width: 320 }}>
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return <DatePicker label="Select date" value={val} onChange={setVal} />;
  },
};

export const OpenInteraction: Story = {
  args: { label: 'Date', onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /select date/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const EscapeClosesInteraction: Story = {
  args: { label: 'Date', onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /select date/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
