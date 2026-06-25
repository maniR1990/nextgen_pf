import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'UI/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Chip>;

function FilterChips() {
  return (
    <div className="chip-row">
      <Chip variant="brand" action="remove" onClick={fn()}>
        Category
      </Chip>
      <Chip variant="success" action="remove" onClick={fn()}>
        Income
      </Chip>
      <Chip variant="neutral" action="add" onClick={fn()}>
        Add filter
      </Chip>
    </div>
  );
}

export const Playground: Story = {
  args: { children: 'Category', variant: 'brand', action: 'remove' },
};

/** Chromatic baseline — removable and add filter chips */
export const FilterChipsStory: Story = {
  name: 'Filter Chips',
  parameters: chromaticBaseline,
  render: () => <FilterChips />,
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
  render: () => <FilterChips />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <FilterChips />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <FilterChips />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <FilterChips />,
};
