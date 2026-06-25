import type { Meta, StoryObj } from '@storybook/react';
import { chromaticBaseline, storyRowStyle, storySectionStyle } from '@/components/ui/storyLayout';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: { label: 'Enable notifications' },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Playground: Story = {};

export const States: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ ...storyRowStyle, flexDirection: 'column', maxWidth: 'calc(24 * var(--space-4))' }}>
      <Toggle label="Off" />
      <Toggle label="On" defaultChecked />
      <Toggle label="Disabled off" disabled />
      <Toggle label="Disabled on" disabled defaultChecked />
      <Toggle
        label="Marketing emails"
        description="Receive product updates"
        defaultChecked
      />
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
  render: () => <Toggle label="Dark mode preview" defaultChecked />,
};
