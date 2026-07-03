'use client';

import { MonthNavControl } from '@/components/common/MonthNavControl/MonthNavControl';
import { MonthPicker } from '@/components/common/MonthPicker/MonthPicker';
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
import { ArrowDownUp, Building2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function TransactionFilterBar() {
  const { filters, setFilters, monthLabel } = useTransactionFilters();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: sources = [] } = useQuery({
    queryKey: queryKeys.paymentSources.list(),
    queryFn: () => apiGetV1<PaymentSourceOption[]>('/api/v1/payment-sources'),
    staleTime: 15 * 60_000,
  });

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  function shiftMonth(delta: number) {
    const d = new Date(filters.year, filters.month - 1 + delta, 1);
    setFilters({ year: d.getFullYear(), month: d.getMonth() + 1 });
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
        {/* Month picker — MonthNavControl (prev/next) + MonthPicker popover */}
        <div className="tx-filter-bar__month-wrap" ref={pickerRef}>
          <MonthNavControl
            label={monthLabel}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
          />
          <button
            type="button"
            className="tx-filter-bar__month-trigger"
            aria-label="Pick month"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((o) => !o)}
          >
            ▾
          </button>
          {pickerOpen && (
            <div className="tx-filter-bar__month-dropdown" role="dialog" aria-label="Month picker">
              <MonthPicker
                value={{ month: filters.month, year: filters.year }}
                clearable={false}
                onChange={({ month, year }) => {
                  setFilters({ month, year });
                  setPickerOpen(false);
                }}
              />
            </div>
          )}
        </div>

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
          <span className="tx-filter-bar__sort-text">
            Date {filters.sort === TRANSACTION_SORT.DATE_DESC ? '↓' : '↑'}
          </span>
        </button>
      </div>
    </div>
  );
}
