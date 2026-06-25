import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge, type BadgeVariant } from './Badge';

const STATUS: { variant: BadgeVariant; label: string }[] = [
  { variant: 'active', label: 'Active' },
  { variant: 'success', label: 'Success' },
  { variant: 'error', label: 'Error' },
  { variant: 'warning', label: 'Warning' },
  { variant: 'inactive', label: 'Inactive' },
  { variant: 'beta', label: 'Beta' },
];

const LABELS: { variant: BadgeVariant; label: string }[] = [
  { variant: 'admin', label: 'Admin' },
  { variant: 'pro', label: 'Pro' },
  { variant: 'free', label: 'Free' },
  { variant: 'verified', label: 'Verified' },
];

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {
  args: { children: 'Active', variant: 'active' },
};

function StatusBadgesRow() {
  return (
    <div style={storyRowStyle}>
      {STATUS.map(({ variant, label }) => (
        <Badge key={variant} variant={variant}>
          {label}
        </Badge>
      ))}
    </div>
  );
}

export const StatusBadges: Story = {
  parameters: chromaticBaseline,
  render: () => <StatusBadgesRow />,
};

export const LabelBadges: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      {LABELS.map(({ variant, label }) => (
        <Badge key={variant} variant={variant} kind="label">
          {label}
        </Badge>
      ))}
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
      <Badge variant="active">Active</Badge>
      <Badge variant="verified" kind="label">
        Verified
      </Badge>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <StatusBadgesRow />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <StatusBadgesRow />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <StatusBadgesRow />,
};
