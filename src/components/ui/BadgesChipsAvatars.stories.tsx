import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

const meta: Meta = {
  title: 'UI/Badges, Chips & Avatars',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Combined overview — status badges, label badges, filter chips, avatars.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function OverviewBoard() {
  return (
    <div style={storySectionStyle}>
      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          Status badges
        </h3>
        <div style={storyRowStyle}>
          <Badge variant="active">Active</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="inactive">Inactive</Badge>
          <Badge variant="beta">Beta</Badge>
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          Label badges
        </h3>
        <div style={storyRowStyle}>
          <Badge variant="admin" kind="label">
            Admin
          </Badge>
          <Badge variant="pro" kind="label">
            Pro
          </Badge>
          <Badge variant="free" kind="label">
            Free
          </Badge>
          <Badge variant="verified" kind="label">
            Verified
          </Badge>
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          Filter chips
        </h3>
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
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          Avatars
        </h3>
        <div style={{ ...storyRowStyle, alignItems: 'center' }}>
          <Avatar initials="AJ" size="xl" color="blue" />
          <Avatar initials="AJ" size="lg" color="purple" />
          <Avatar initials="AJ" size="md" color="green" />
          <Avatar initials="AJ" shape="rounded" color="blue" />
          <Avatar initials="BK" color="green" status="online" />
          <AvatarGroup>
            <Avatar initials="A" size="sm" color="blue" />
            <Avatar initials="B" size="sm" color="purple" />
            <Avatar initials="C" size="sm" color="green" />
          </AvatarGroup>
        </div>
      </section>
    </div>
  );
}

/** Chromatic baseline — combined component board */
export const Overview: Story = {
  parameters: chromaticBaseline,
  render: () => <OverviewBoard />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <OverviewBoard />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <OverviewBoard />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <OverviewBoard />,
};

export const DarkMode: Story = {
  parameters: chromaticBaseline,
  decorators: [
    (Story) => (
      <div data-theme="dark">
        <Story />
      </div>
    ),
  ],
  render: () => <OverviewBoard />,
};
