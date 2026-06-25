import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { chromaticBaseline, storySectionStyle } from '@/components/ui/storyLayout';
import { Radio, RadioGroup } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'UI/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const States: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
      <Radio name="demo" label="Unselected" value="a" />
      <Radio name="demo" label="Selected" value="b" defaultChecked />
      <Radio name="demo" label="Disabled" value="c" disabled />
    </div>
  ),
};

function GroupExample() {
  const [value, setValue] = useState('monthly');
  return (
    <RadioGroup name="plan" legend="Billing cycle" value={value} onChange={setValue}>
      <Radio label="Monthly" value="monthly" />
      <Radio label="Yearly" value="yearly" description="Save 20%" />
    </RadioGroup>
  );
}

export const Group: Story = {
  parameters: chromaticBaseline,
  render: () => <GroupExample />,
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
  render: () => <GroupExample />,
};
