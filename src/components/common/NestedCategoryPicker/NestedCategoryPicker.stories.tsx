import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NestedCategoryPicker } from './NestedCategoryPicker';
import type { CategoryNode } from './NestedCategoryPicker';

const chromatic = { chromatic: { disableSnapshot: false } };

const CATEGORIES: CategoryNode[] = [
  {
    id: 'food',
    label: 'Food & Home',
    icon: '🍽️',
    color: '#fff3e0',
    children: [
      {
        id: 'dining',
        label: 'Dining',
        icon: '🍜',
        color: '#fff3e0',
        children: [
          { id: 'restaurant', label: 'Restaurant' },
          { id: 'fast-food', label: 'Fast Food' },
          { id: 'cafe', label: 'Café' },
        ],
      },
      {
        id: 'groceries',
        label: 'Groceries',
        icon: '🛒',
        color: '#e8f5e9',
        children: [
          { id: 'supermarket', label: 'Supermarket' },
          { id: 'vegetables', label: 'Vegetables' },
        ],
      },
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
    ],
  },
  { id: 'misc', label: 'Miscellaneous', icon: '📦', color: '#f5f5f5' },
];

const meta: Meta<typeof NestedCategoryPicker> = {
  title: 'Common/NestedCategoryPicker',
  component: NestedCategoryPicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { categories: CATEGORIES, label: 'Category' },
};

export default meta;
type Story = StoryObj<typeof NestedCategoryPicker>;

export const Playground: Story = {
  render: (args) => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 360 }}>
        <NestedCategoryPicker {...args} value={val} onChange={(id) => setVal(id)} />
      </div>
    );
  },
};

export const WithValue: Story = {
  args: { value: 'misc', onChange: fn() },
  render: (args) => (
    <div style={{ width: 360 }}>
      <NestedCategoryPicker {...args} />
    </div>
  ),
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <div style={{ width: 360 }}>
        <NestedCategoryPicker categories={CATEGORIES} value={val} onChange={(id) => setVal(id)} />
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <NestedCategoryPicker categories={CATEGORIES} value={val} onChange={(id) => setVal(id)} />
    );
  },
};

export const DarkMode: Story = {
  parameters: { ...chromatic, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)', width: 360 }}>
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [val, setVal] = useState<string | null>(null);
    return (
      <NestedCategoryPicker categories={CATEGORIES} value={val} onChange={(id) => setVal(id)} />
    );
  },
};

export const DrillInteraction: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <div style={{ width: 360 }}>
      <NestedCategoryPicker {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const foodBtn = canvas.getByRole('button', { name: /food/i });
    await userEvent.click(foodBtn);
    await expect(canvas.getByRole('button', { name: /dining/i })).toBeInTheDocument();
  },
};
