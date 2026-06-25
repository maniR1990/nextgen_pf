'use client';

import {
  TRANSACTION_FILTER_ALL,
  TRANSACTION_FILTER_CHIPS,
  TRANSACTION_SORT,
  type TransactionFilterChip,
} from '@/constants/transactions';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { PaymentSourceOption } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, Building2, Calendar } from 'lucide-react';

export function TransactionFilterBar() {
  const { filters, setFilters, monthLabel } = useTransactionFilters();

  const { data: sources = [] } = useQuery({
    queryKey: queryKeys.paymentSources.list(),
    queryFn: () => apiGetV1<PaymentSourceOption[]>('/api/v1/payment-sources'),
    staleTime: 15 * 60_000,
  });

  const monthInputValue = `${filters.year}-${String(filters.month).padStart(2, '0')}`;

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [y, m] = e.target.value.split('-').map(Number);
    if (y && m) setFilters({ year: y, month: m });
  }

  function toggleSort() {
    setFilters({
      sort:
        filters.sort === TRANSACTION_SORT.DATE_DESC
          ? TRANSACTION_SORT.DATE_ASC
          : TRANSACTION_SORT.DATE_DESC,
    });
  }

  return (
    <div className="tx-filter-bar" role="toolbar" aria-label="Transaction filters">
      <div className="tx-filter-bar__chips" role="group" aria-label="Transaction type">
        {TRANSACTION_FILTER_CHIPS.map((chip) => {
          const active = filters.typeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              className={['tx-filter-bar__chip', active && 'tx-filter-bar__chip--active']
                .filter(Boolean)
                .join(' ')}
              aria-pressed={active}
              onClick={() => setFilters({ typeChip: chip.id as TransactionFilterChip })}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="tx-filter-bar__controls">
        <label className="tx-filter-bar__control tx-filter-bar__control--month">
          <Calendar size={14} aria-hidden className="tx-filter-bar__control-icon" />
          <span className="tx-filter-bar__control-label">{monthLabel}</span>
          <input
            type="month"
            className="tx-filter-bar__month-input"
            value={monthInputValue}
            onChange={handleMonthChange}
            aria-label="Budget period month"
          />
        </label>

        <label className="tx-filter-bar__control">
          <Building2 size={14} aria-hidden className="tx-filter-bar__control-icon" />
          <select
            className="tx-filter-bar__select"
            value={filters.paymentSourceId ?? 'all'}
            onChange={(e) => {
              const v = e.target.value;
              setFilters({ paymentSourceId: v === 'all' ? undefined : v });
            }}
            aria-label="Filter by account"
          >
            <option value="all">All accounts</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="tx-filter-bar__control tx-filter-bar__sort"
          onClick={toggleSort}
          aria-label={`Sort by date ${filters.sort === TRANSACTION_SORT.DATE_DESC ? 'newest first' : 'oldest first'}`}
        >
          <ArrowDownUp size={14} aria-hidden className="tx-filter-bar__control-icon" />
          Date {filters.sort === TRANSACTION_SORT.DATE_DESC ? '↓' : '↑'}
        </button>
      </div>
    </div>
  );
}
