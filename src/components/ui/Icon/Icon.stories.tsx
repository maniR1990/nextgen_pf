import type { Meta, StoryObj } from '@storybook/react';
import { ICON_SIZE_USAGE, ICON_SIZES, type IconSize } from '@/constants/icons';
import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { AppIcons } from './appIcons';
import { Icon } from './Icon';

const SIZES = Object.keys(ICON_SIZES) as IconSize[];

const SAMPLE_ICONS = [
  { name: 'Home', icon: AppIcons.home },
  { name: 'Card', icon: AppIcons.card },
  { name: 'Chart', icon: AppIcons.chart },
  { name: 'Bell', icon: AppIcons.bell },
  { name: 'Settings', icon: AppIcons.settings },
  { name: 'Profile', icon: AppIcons.profile },
] as const;

const meta: Meta<typeof Icon> = {
  title: 'Design System/Icons',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Lucide React icon system — 1.5px stroke, semantic token colors via currentColor.',
      },
    },
  },
  args: { icon: AppIcons.home, size: 'md' },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Playground: Story = {};

function SizeScale() {
  return (
    <div style={storySectionStyle}>
      {SIZES.map((size) => (
        <div key={size} style={{ ...storyRowStyle, alignItems: 'center' }}>
          <Icon icon={AppIcons.home} size={size} />
          <span className="type-body">
            <strong>{size.toUpperCase()}</strong> ({ICON_SIZES[size]}px) — {ICON_SIZE_USAGE[size]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Chromatic baseline — Lucide size scale */
export const Sizes: Story = {
  parameters: chromaticBaseline,
  render: () => <SizeScale />,
};

export const SampleSet: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      {SAMPLE_ICONS.map(({ name, icon }) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            minWidth: 'calc(14 * var(--space-4))',
          }}
        >
          <Icon icon={icon} size="md" tone="brand" />
          <span className="type-caption">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      <Icon icon={AppIcons.bell} size="lg" tone="inherit" />
      <Icon icon={AppIcons.bell} size="lg" tone="muted" />
      <Icon icon={AppIcons.bell} size="lg" tone="brand" />
      <Icon icon={AppIcons.bell} size="lg" tone="success" />
      <Icon icon={AppIcons.bell} size="lg" tone="warning" />
      <Icon icon={AppIcons.bell} size="lg" tone="error" />
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <SizeScale />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <SampleSet />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <SampleSet />,
};
