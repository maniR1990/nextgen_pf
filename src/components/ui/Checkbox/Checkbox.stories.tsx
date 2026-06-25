import { chromaticBaseline, storyRowStyle, storySectionStyle } from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: { label: 'Accept terms' },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {};

export const States: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate defaultChecked />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  ),
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
  render: () => (
    <div style={storyRowStyle}>
      <Checkbox label="Remember me" defaultChecked />
      <Checkbox label="Newsletter" />
    </div>
  ),
};
