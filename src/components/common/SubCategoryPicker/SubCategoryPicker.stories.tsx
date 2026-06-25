import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SubCategoryPicker } from './SubCategoryPicker';
import type { ParentCategory } from './SubCategoryPicker';

const chromatic = { chromatic: { disableSnapshot: false } };

const CATEGORIES: ParentCategory[] = [
  {
    id: 'food',
    label: 'Food & Home',
    icon: '🍽️',
    color: '#fff3e0',
    children: [
      { id: 'groceries', label: 'Groceries', icon: '🛒' },
      { id: 'dining', label: 'Dining Out', icon: '🍜' },
      { id: 'snacks', label: 'Snacks', icon: '🍿' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: '🚗',
    color: '#e3f2fd',
    children: [
      { id: 'fuel', label: 'Fuel', icon: '⛽' },
      { id: 'metro', label: 'Metro', icon: '🚇' },
      { id: 'cab', label: 'Cab', icon: '🚕' },
    ],
  },
  {
    id: 'housing',
    label: 'Housing',
    icon: '🏠',
    color: '#f3e5f5',
    children: [
      { id: 'rent', label: 'Rent', icon: '🏠' },
      { id: 'electricity', label: 'Electricity', icon: '⚡' },
      { id: 'water', label: 'Water', icon: '💧' },
    ],
  },
];

const meta: Meta<typeof SubCategoryPicker> = {
  title: 'Common/SubCategoryPicker',
  component: SubCategoryPicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { categories: CATEGORIES, label: 'Category' },
};

export default meta;
type Story = StoryObj<typeof SubCategoryPicker>;

export const Playground: Story = {
  render: (args) => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 440 }}>
        <SubCategoryPicker {...args} value={val} onChange={(id) => setVal(id)} />
      </div>
    );
  },
};

export const WithValue: Story = {
  args: { value: 'groceries', onChange: fn() },
  render: (args) => (
    <div style={{ width: 440 }}>
      <SubCategoryPicker {...args} />
    </div>
  ),
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 440 }}>
        <SubCategoryPicker
          categories={CATEGORIES}
          label="Category"
          value={val}
          onChange={(id) => setVal(id)}
        />
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <SubCategoryPicker
        categories={CATEGORIES}
        label="Category"
        value={val}
        onChange={(id) => setVal(id)}
      />
    );
  },
};

export const DarkMode: Story = {
  parameters: { ...chromatic, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)', width: 440 }}>
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <SubCategoryPicker
        categories={CATEGORIES}
        label="Category"
        value={val}
        onChange={(id) => setVal(id)}
      />
    );
  },
};

export const SelectInteraction: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <div style={{ width: 440 }}>
      <SubCategoryPicker {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const groceriesBtn = canvas.getByRole('option', { name: /groceries/i });
    await userEvent.click(groceriesBtn);
    await expect(args.onChange).toHaveBeenCalledWith('groceries', 'food');
  },
};
