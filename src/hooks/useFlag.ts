'use client';

import useSWR from 'swr';
import { FLAGS, type FlagKey } from '@/lib/flags/flags';

export function useFlag(flag: FlagKey) {
  const { data } = useSWR<{ enabled: boolean }>(`/api/flags/${FLAGS[flag].key}`);
  return data?.enabled ?? FLAGS[flag].defaultValue;
}
