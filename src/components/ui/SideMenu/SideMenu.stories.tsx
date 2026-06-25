import type { Meta, StoryObj } from '@storybook/react';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
} from '@/components/ui/storyLayout';
import { SideMenu } from './SideMenu';
import sampleConfig from './sampleSideMenu.json';
import { SideMenuConfigSchema } from './schemas';

const config = SideMenuConfigSchema.parse(sampleConfig);

const meta: Meta<typeof SideMenu> = {
  title: 'UI/Side Menu',
  component: SideMenu,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof SideMenu>;

function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        ...storySectionStyle,
        minHeight: 'calc(48 * var(--space-4))',
        padding: 0,
        background: 'var(--color-bg)',
      }}
    >
      {children}
    </div>
  );
}

export const Expanded: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <ShellFrame>
      <SideMenu config={config} defaultCollapsed={false} activeId="dashboard" variant="standalone" />
    </ShellFrame>
  ),
};

export const Collapsed: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <ShellFrame>
      <SideMenu config={config} defaultCollapsed activeId="budget" variant="standalone" />
    </ShellFrame>
  ),
};

export const JsonConfig: Story = {
  render: () => (
    <ShellFrame>
      <SideMenu config={config} activeId="transactions" variant="standalone" />
    </ShellFrame>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <ShellFrame>
      <SideMenu config={config} activeId="dashboard" className="side-menu--mobile-labels" />
    </ShellFrame>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <ShellFrame>
      <SideMenu config={config} activeId="dashboard" />
    </ShellFrame>
  ),
};
