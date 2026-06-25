import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
} from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CategoryHierarchy } from './CategoryHierarchy';
import sample from './samples/category-hierarchy.sample.json';
import { CategoryHierarchyConfigSchema } from './schemas';
import type { CategoryHierarchyNodeJson } from './schemas';

const config = CategoryHierarchyConfigSchema.parse(sample);

const meta: Meta<typeof CategoryHierarchy> = {
  title: 'Common/CategoryHierarchy',
  component: CategoryHierarchy,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof CategoryHierarchy>;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...storySectionStyle,
        maxWidth: 'calc(48 * var(--space-4))',
        padding: 'var(--space-4)',
        background: 'var(--color-bg)',
      }}
    >
      {children}
    </div>
  );
}

export const Default: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <Panel>
      <CategoryHierarchy config={config} />
    </Panel>
  ),
};

export const InteractiveCrud: Story = {
  render: function Render() {
    const [nodes, setNodes] = useState(config.nodes);
    const [log, setLog] = useState<string[]>([]);

    const pushLog = (message: string) => setLog((prev) => [message, ...prev].slice(0, 5));

    const handleDelete = (node: CategoryHierarchyNodeJson) => {
      const removeNode = (items: CategoryHierarchyNodeJson[]): CategoryHierarchyNodeJson[] =>
        items
          .filter((item) => item.id !== node.id)
          .map((item) => ({
            ...item,
            children: item.children ? removeNode(item.children) : undefined,
          }));

      setNodes(removeNode(nodes));
      pushLog(`Deleted ${node.name}`);
    };

    return (
      <Panel>
        <CategoryHierarchy
          config={{ ...config, nodes }}
          onCreate={({ parentId, parentLevel }) =>
            pushLog(`Create child under ${parentId} (level ${parentLevel})`)
          }
          onUpdate={(node) => pushLog(`Edit ${node.name}`)}
          onDelete={handleDelete}
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
      </Panel>
    );
  },
};

export const ReadOnly: Story = {
  render: () => (
    <Panel>
      <CategoryHierarchy config={config} readOnly defaultExpandedIds={['income']} />
    </Panel>
  ),
};

export const Mobile: Story = {
  parameters: { ...viewportMobile, ...chromaticBaseline },
  render: () => (
    <Panel>
      <CategoryHierarchy config={config} />
    </Panel>
  ),
};

export const Desktop: Story = {
  parameters: { ...viewportDesktop, ...chromaticBaseline },
  render: () => (
    <Panel>
      <CategoryHierarchy config={config} />
    </Panel>
  ),
};
