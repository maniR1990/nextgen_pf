'use client';

import { FLAGS, type FlagKey } from '@/lib/flags/flags';
import useSWR from 'swr';

export function useFlag(flag: FlagKey) {
  const { data } = useSWR<{ enabled: boolean }>(`/api/flags/${FLAGS[flag].key}`);
  return data?.enabled ?? FLAGS[flag].defaultValue;
}
