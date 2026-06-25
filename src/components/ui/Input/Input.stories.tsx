import { chromaticBaseline, storyGridStyle, storySectionStyle } from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: {
    label: 'Email',
    placeholder: 'Enter value...',
    fullWidth: true,
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Playground: Story = {};

export const States: Story = {
  parameters: {
    ...chromaticBaseline,
    docs: { description: { story: 'Default, focus, hint, error, success, disabled.' } },
  },
  render: () => (
    <div style={storyGridStyle}>
      <Input label="Default" placeholder="Enter value..." />
      <Input label="Focused" defaultValue="Active input" visualState="focus" />
      <Input label="With hint" defaultValue="you@example.com" hint="We'll never share your email" />
      <Input label="Error" defaultValue="invalid@" error="Invalid email address" />
      <Input label="Success" defaultValue="alice@example.com" success="Email verified" />
      <Input label="Disabled" defaultValue="Read only" disabled />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { ...chromaticBaseline, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={storySectionStyle}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={storyGridStyle}>
      <Input label="Email" placeholder="you@example.com" hint="Helper text" />
      <Input label="Password" type="password" error="Required field" />
    </div>
  ),
};
