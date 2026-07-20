import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGetV1 } from '@/lib/query/fetcher';
import { useAppHeaderData } from './useAppHeaderData';

// Regression coverage: this hook used to call the global `fetch` directly, bypassing the
// session-aware wrapper every other authenticated hook goes through. That meant an expired
// session here just threw and left the header stuck on stale fallback data instead of
// refreshing or redirecting to login like the rest of the app — see fetcher.test.ts for
// the session-recovery behavior itself.
vi.mock('@/lib/query/fetcher', () => ({
  apiGetV1: vi.fn().mockResolvedValue({ netWorth: 100 }),
}));

afterEach(() => vi.clearAllMocks());

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useAppHeaderData', () => {
  it('fetches through apiGetV1 (the session-aware wrapper), not a raw fetch', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useAppHeaderData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiGetV1).toHaveBeenCalledWith('/api/v1/dashboard/summary');
  });
});
