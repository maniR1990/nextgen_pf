'use client';

import { useMemo } from 'react';
import { CategoryHierarchy } from '@/components/common/CategoryHierarchy';
import type { CategoryHierarchyNodeJson } from '@/components/common/CategoryHierarchy/schemas';
import type { CategoryHierarchyCrudHandlers } from '@/components/common/CategoryHierarchy/CategoryHierarchyTreeNode';
import { useSettingsTab } from '@/hooks/useSettingsTab';
import type { SettingsPageConfigJson } from './schemas';

export interface SettingsWorkspaceProps extends CategoryHierarchyCrudHandlers {
  config: SettingsPageConfigJson;
  readOnly?: boolean;
  className?: string;
  hierarchyOverrides?: Partial<Record<string, CategoryHierarchyNodeJson[]>>;
  canEdit?: (node: CategoryHierarchyNodeJson) => boolean;
  canDelete?: (node: CategoryHierarchyNodeJson) => boolean;
}

export function SettingsWorkspace({
  config,
  readOnly = false,
  onCreate,
  onUpdate,
  onDelete,
  hierarchyOverrides,
  canEdit,
  canDelete,
  className = '',
}: SettingsWorkspaceProps) {
  const tabIds = useMemo(() => config.tabs.map((tab) => tab.id), [config.tabs]);
  const { activeTabId } = useSettingsTab(config.defaultTabId, tabIds);

  const activeTab = config.tabs.find((tab) => tab.id === activeTabId) ?? config.tabs[0];

  const hierarchyConfig = useMemo(() => {
    if (!activeTab?.panel.hierarchy) return null;
    const overrideNodes = hierarchyOverrides?.[activeTab.id];
    if (!overrideNodes) return activeTab.panel.hierarchy;
    return { ...activeTab.panel.hierarchy, nodes: overrideNodes };
  }, [activeTab, hierarchyOverrides]);

  const crudActive = activeTab.crud === true;

  return (
    <div className={['settings-workspace', className].filter(Boolean).join(' ')}>
      <div
        className="settings-workspace__panel"
        role="tabpanel"
        aria-label={activeTab.label}
        id={`settings-panel-${activeTab.id}`}
      >
        {activeTab.panel.type === 'hierarchy' && hierarchyConfig ? (
          <CategoryHierarchy
            config={hierarchyConfig}
            readOnly={readOnly}
            onCreate={crudActive ? onCreate : undefined}
            onUpdate={crudActive ? onUpdate : undefined}
            onDelete={crudActive ? onDelete : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ) : null}
      </div>
    </div>
  );
}
