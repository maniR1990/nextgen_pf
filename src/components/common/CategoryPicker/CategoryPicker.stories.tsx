import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { CategoryPicker } from './CategoryPicker';
import type { CategoryPickerOption } from './CategoryPicker';

const chromatic = { chromatic: { disableSnapshot: false } };

const OPTIONS: CategoryPickerOption[] = [
  { id: 'c1', label: 'Groceries', icon: '🛒', color: '#e8f5e9', parentLabel: 'Food & Home' },
  { id: 'c2', label: 'Dining Out', icon: '🍽️', color: '#fff3e0', parentLabel: 'Food & Home' },
  { id: 'c3', label: 'Fuel', icon: '⛽', color: '#fce4ec', parentLabel: 'Transport' },
  { id: 'c4', label: 'Metro / Bus', icon: '🚌', color: '#e3f2fd', parentLabel: 'Transport' },
  { id: 'c5', label: 'Netflix', icon: '📺', color: '#fce4ec', parentLabel: 'Entertainment' },
  { id: 'c6', label: 'Spotify', icon: '🎵', color: '#e8f5e9', parentLabel: 'Entertainment' },
  { id: 'c7', label: 'Rent', icon: '🏠', color: '#f3e5f5', parentLabel: 'Housing' },
  { id: 'c8', label: 'Electricity', icon: '⚡', color: '#fffde7', parentLabel: 'Housing' },
];

const meta: Meta<typeof CategoryPicker> = {
  title: 'Common/CategoryPicker',
  component: CategoryPicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { options: OPTIONS, label: 'Category', placeholder: 'Select category' },
};

export default meta;
type Story = StoryObj<typeof CategoryPicker>;

export const Playground: Story = {
  render: (args) => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 320 }}>
        <CategoryPicker {...args} value={val} onChange={setVal} />
      </div>
    );
  },
};

export const WithValue: Story = {
  args: { value: 'c1', onChange: fn() },
  render: (args) => (
    <div style={{ width: 320 }}>
      <CategoryPicker {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: { error: 'Category is required', onChange: fn() },
  render: (args) => (
    <div style={{ width: 320 }}>
      <CategoryPicker {...args} />
    </div>
  ),
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 320 }}>
        <CategoryPicker options={OPTIONS} label="Category" value={val} onChange={setVal} />
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return <CategoryPicker options={OPTIONS} label="Category" value={val} onChange={setVal} />;
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
    return <CategoryPicker options={OPTIONS} label="Category" value={val} onChange={setVal} />;
  },
};

export const SelectInteraction: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <div style={{ width: 320 }}>
      <CategoryPicker {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    const option = canvas.getByRole('option', { name: /groceries/i });
    await userEvent.click(option);
    await expect(args.onChange).toHaveBeenCalledWith('c1');
  },
};
