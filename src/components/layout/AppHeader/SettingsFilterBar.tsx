'use client';

import { useSettingsTab } from '@/hooks/useSettingsTab';

const SETTINGS_TABS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'funds', label: 'Funds' },
  { id: 'categories', label: 'Categories' },
] as const;

const TAB_IDS = SETTINGS_TABS.map((t) => t.id) as string[];

export function SettingsFilterBar() {
  const { activeTabId, setActiveTabId } = useSettingsTab('accounts', TAB_IDS);

  return (
    <div className="tx-filter-bar" role="toolbar" aria-label="Settings sections">
      <div className="tx-filter-bar__chips" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map((tab) => {
          const active = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={['tx-filter-bar__chip', active && 'tx-filter-bar__chip--active']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
