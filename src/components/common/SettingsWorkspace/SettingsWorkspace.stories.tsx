import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
} from '@/components/ui/storyLayout';
import { SegmentChipTabs } from '@/components/common/SegmentChipTabs';
import { SettingsWorkspace } from './SettingsWorkspace';
import { SettingsPageConfigSchema } from './schemas';
import rawConfig from '@/config/settingsPage.json';

const config = SettingsPageConfigSchema.parse(rawConfig);

const meta: Meta<typeof SettingsWorkspace> = {
  title: 'Common/SettingsWorkspace',
  component: SettingsWorkspace,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof SettingsWorkspace>;

function SettingsStoryShell({
  children,
  initialTab = config.defaultTabId,
}: {
  children: React.ReactNode;
  initialTab?: string;
}) {
  const [activeTabId, setActiveTabId] = useState(initialTab);

  return (
    <div style={{ ...storySectionStyle, background: 'var(--color-bg)' }}>
      <div
        style={{
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <SegmentChipTabs
          items={config.tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
          value={activeTabId}
          onChange={setActiveTabId}
          aria-label={config.ariaLabel}
        />
      </div>
      <div style={{ padding: 'var(--space-4)' }}>{children}</div>
    </div>
  );
}

export const Default: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <SettingsStoryShell>
      <SettingsWorkspace config={config} />
    </SettingsStoryShell>
  ),
};

export const CategoriesTab: Story = {
  render: () => (
    <SettingsStoryShell initialTab="categories">
      <SettingsWorkspace config={config} />
    </SettingsStoryShell>
  ),
};

export const InteractiveCrud: Story = {
  render: function Render() {
    const [log, setLog] = useState<string[]>([]);
    const pushLog = (message: string) => setLog((prev) => [message, ...prev].slice(0, 6));

    return (
      <SettingsStoryShell initialTab="categories">
        <SettingsWorkspace
          config={config}
          onCreate={({ parentId }) => pushLog(`Create under ${parentId}`)}
          onUpdate={(node) => pushLog(`Edit ${node.name}`)}
          onDelete={(node) => pushLog(`Delete ${node.name}`)}
        />
        {log.length > 0 && (
          <pre
            style={{
              marginTop: 'var(--space-4)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {log.join('\n')}
          </pre>
        )}
      </SettingsStoryShell>
    );
  },
};

export const Mobile: Story = {
  parameters: { ...viewportMobile, ...chromaticBaseline },
  render: () => (
    <SettingsStoryShell>
      <SettingsWorkspace config={config} />
    </SettingsStoryShell>
  ),
};

export const Desktop: Story = {
  parameters: { ...viewportDesktop, ...chromaticBaseline },
  render: () => (
    <SettingsStoryShell>
      <SettingsWorkspace config={config} />
    </SettingsStoryShell>
  ),
};
