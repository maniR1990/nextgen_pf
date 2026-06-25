'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { FundSummary } from '@/modules/funds/funds.types';
import type { AccountDetail } from '@/modules/accounts/accounts.types';
import { AccountDetailDrawer } from '@/components/features/accounts/AccountDetailDrawer';
import { FundDetailHeader } from './FundDetailHeader';
import { FundAllocationList } from './FundAllocationList';

export function FundDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const { data: fund, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.funds.list(), id],
    queryFn: () => apiGetV1<FundSummary>(`/api/v1/funds/${id}`),
    staleTime: 30_000,
  });

  const handleAccountSelect = useCallback(async (accountId: string) => {
    if (selectedAccountId === accountId) return;
    setSelectedAccountId(accountId);
    setAccountDetail(null);
    setAccountLoading(true);
    try {
      const detail = await apiGetV1<AccountDetail>(`/api/v1/accounts/${accountId}`);
      setAccountDetail(detail);
    } finally {
      setAccountLoading(false);
    }
  }, [selectedAccountId]);

  return (
    <div
      className="fund-detail"
      style={fund?.color ? ({ '--fund-color': fund.color } as React.CSSProperties) : undefined}
    >
      <nav className="fund-detail__nav" aria-label="Page navigation">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push('/dashboard/settings?tab=funds')}
        >
          <ArrowLeft size={14} aria-hidden />
          Fund Buckets
        </Button>
      </nav>

      {isLoading && (
        <div className="fund-detail__loading" aria-busy="true" aria-live="polite">
          <Skeleton variant="rect" height={72} />
          <Skeleton variant="rect" height={44} />
          <Skeleton variant="rect" height={44} />
          <Skeleton variant="rect" height={44} />
        </div>
      )}

      {isError && (
        <div className="fund-detail__error" role="alert">
          <EmptyState title="Could not load fund" description="Something went wrong. Please try again." />
        </div>
      )}

      {fund && (
        <>
          <FundDetailHeader fund={fund} />

          <div className="fund-detail__split">
            <FundAllocationList
              sources={fund.sources}
              targetAmount={fund.targetAmount}
              selectedAccountId={selectedAccountId}
              onSelect={handleAccountSelect}
            />

            <div className="fund-detail__detail-pane">
              {accountLoading && (
                <div className="fund-detail__detail-loading" role="status" aria-label="Loading account">
                  <Skeleton variant="rect" height={100} />
                  <Skeleton variant="rect" height={52} />
                  <Skeleton variant="rect" height={52} />
                </div>
              )}

              {!accountLoading && accountDetail && (
                <AccountDetailDrawer
                  key={accountDetail.id}
                  inline
                  open
                  account={accountDetail}
                  onClose={() => { setAccountDetail(null); setSelectedAccountId(null); }}
                />
              )}

              {!accountLoading && !accountDetail && (
                <EmptyState
                  icon={Wallet}
                  title="Select an account"
                  description="Click an account on the left to view its details, transactions, and settings."
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
