import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Toggle } from '@/components/ui/Toggle';
import { chromaticBaseline, storyGridStyle, storySectionStyle } from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

const meta: Meta = {
  title: 'UI/Form Inputs',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Form input overview — text fields, toggles, checkboxes, radios.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function SelectionControls() {
  const [plan, setPlan] = useState('monthly');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <Toggle label="Enable feature" defaultChecked />
      <Toggle label="Disabled toggle" disabled />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Unchecked" />
      <Checkbox label="Indeterminate" indeterminate />
      <RadioGroup name="overview-plan" legend="Plan" value={plan} onChange={setPlan}>
        <Radio label="Selected" value="monthly" />
        <Radio label="Unselected" value="yearly" />
      </RadioGroup>
    </div>
  );
}

function FormInputsOverview() {
  return (
    <div style={storySectionStyle}>
      <div style={storyGridStyle}>
        <Input label="Default" placeholder="Enter value..." />
        <Input label="Focused" defaultValue="Active input" visualState="focus" />
        <Input
          label="With hint"
          defaultValue="you@example.com"
          hint="We'll never share your email"
        />
        <Input label="Error" defaultValue="invalid@" error="Invalid email address" />
        <Input label="Success" defaultValue="alice@example.com" success="Email verified" />
        <Input label="Disabled" defaultValue="Read only" disabled />
      </div>
      <SelectionControls />
    </div>
  );
}

/** Chromatic baseline — matches form inputs spec board */
export const Overview: Story = {
  parameters: chromaticBaseline,
  render: () => <FormInputsOverview />,
};

export const Mobile: Story = {
  parameters: {
    ...chromaticBaseline,
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => <FormInputsOverview />,
};
