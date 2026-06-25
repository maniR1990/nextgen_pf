'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SETTINGS_TAB_QUERY_KEY } from '@/constants/settings';

export function useSettingsTab(defaultTabId: string, validTabIds: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTabId = useMemo(() => {
    const tab = searchParams.get(SETTINGS_TAB_QUERY_KEY);
    if (tab && validTabIds.includes(tab)) return tab;
    return defaultTabId;
  }, [searchParams, defaultTabId, validTabIds]);

  const setActiveTabId = useCallback(
    (tabId: string) => {
      if (!validTabIds.includes(tabId)) return;

      const params = new URLSearchParams(searchParams.toString());
      if (tabId === defaultTabId) {
        params.delete(SETTINGS_TAB_QUERY_KEY);
      } else {
        params.set(SETTINGS_TAB_QUERY_KEY, tabId);
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [defaultTabId, pathname, router, searchParams, validTabIds],
  );

  return { activeTabId, setActiveTabId };
}
