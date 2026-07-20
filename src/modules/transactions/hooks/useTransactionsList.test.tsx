import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithSession } from '@/lib/query/fetcher';
import { useTransactionsList } from './useTransactionsList';

// Regression coverage: this hook used to call the global `fetch` directly, bypassing the
// session-aware wrapper every other authenticated hook goes through — so an expired session
// on the Transactions page just threw "Failed to fetch transactions" instead of refreshing
// or redirecting to login like other screens. See fetcher.test.ts for the session-recovery
// behavior itself.
vi.mock('@/lib/query/fetcher', () => ({
  fetchWithSession: vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: [], meta: { hasMore: false } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  ),
}));

afterEach(() => vi.clearAllMocks());

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useTransactionsList', () => {
  it('fetches through fetchWithSession (the session-aware wrapper), not a raw fetch', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useTransactionsList({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchWithSession).toHaveBeenCalledWith(expect.stringContaining('/api/v1/transactions?'));
  });
});
