import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, type AvatarColor, AvatarGroup, type AvatarSize } from './Avatar';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const SIZE_COLORS: AvatarColor[] = ['blue', 'purple', 'green', 'orange', 'red'];
const ALL_COLORS: AvatarColor[] = ['blue', 'purple', 'green', 'orange', 'red', 'gray'];

function SizesRow() {
  return (
    <div style={storyRowStyle}>
      {SIZES.map((size, i) => (
        <Avatar key={size} size={size} color={SIZE_COLORS[i] ?? 'blue'} initials="AJ" />
      ))}
    </div>
  );
}

function ShapesAndStatusRow() {
  return (
    <div style={storyRowStyle}>
      <Avatar initials="AJ" shape="rounded" color="blue" />
      <Avatar initials="BK" color="green" status="online" />
      <Avatar initials="CL" color="gray" status="offline" />
      <Avatar initials="DM" color="orange" status="away" />
    </div>
  );
}

function GroupRow() {
  return (
    <AvatarGroup max={4}>
      <Avatar initials="A" size="sm" color="blue" />
      <Avatar initials="B" size="sm" color="purple" />
      <Avatar initials="C" size="sm" color="green" />
      <Avatar initials="D" size="sm" color="orange" />
      <Avatar initials="E" size="sm" color="red" />
    </AvatarGroup>
  );
}

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
  args: { initials: 'AJ' },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Playground: Story = {
  args: { size: 'md', color: 'blue' },
};

/** Chromatic baseline — size scale */
export const Sizes: Story = {
  parameters: chromaticBaseline,
  render: () => <SizesRow />,
};

/** Chromatic baseline — shapes and presence status */
export const ShapesAndStatus: Story = {
  parameters: chromaticBaseline,
  render: () => <ShapesAndStatusRow />,
};

/** Chromatic baseline — stacked group with overflow */
export const Group: Story = {
  parameters: chromaticBaseline,
  render: () => <GroupRow />,
};

/** Chromatic baseline — color palette */
export const Colors: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storyRowStyle}>
      {ALL_COLORS.map((color) => (
        <Avatar key={color} initials="AJ" color={color} />
      ))}
    </div>
  ),
};

/** Chromatic baseline — photo avatar */
export const WithImage: Story = {
  parameters: chromaticBaseline,
  args: {
    initials: 'AJ',
    src: 'https://i.pravatar.cc/80?img=12',
    alt: 'Alice Johnson',
    size: 'lg',
  },
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
    <AvatarGroup>
      <Avatar initials="A" size="sm" color="blue" status="online" />
      <Avatar initials="B" size="sm" color="purple" />
      <Avatar initials="C" size="sm" color="green" />
    </AvatarGroup>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <SizesRow />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <GroupRow />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <SizesRow />,
};
