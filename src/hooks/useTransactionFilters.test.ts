import { TRANSACTION_FILTER_ALL, TRANSACTION_SORT } from '@/constants/transactions';
import {
  filtersToApiParams,
  filtersToQueryString,
  parseTransactionFilters,
} from '@/hooks/useTransactionFilters';
import { describe, expect, it } from 'vitest';

describe('transaction filter URL helpers', () => {
  it('parseTransactionFilters applies defaults for empty params', () => {
    const filters = parseTransactionFilters(new URLSearchParams());
    expect(filters.typeChip).toBe(TRANSACTION_FILTER_ALL);
    expect(filters.sort).toBe(TRANSACTION_SORT.DATE_DESC);
    expect(filters.year).toBeGreaterThan(2020);
    expect(filters.month).toBeGreaterThanOrEqual(1);
  });

  it('filtersToQueryString round-trips type and month', () => {
    const qs = filtersToQueryString({
      year: 2026,
      month: 6,
      typeChip: 'expense',
      sort: TRANSACTION_SORT.DATE_DESC,
    });
    const parsed = parseTransactionFilters(new URLSearchParams(qs));
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(6);
    expect(parsed.typeChip).toBe('expense');
  });

  it('filtersToApiParams maps transfer chip to types param', () => {
    const params = filtersToApiParams({
      year: 2026,
      month: 6,
      typeChip: 'transfer',
      sort: TRANSACTION_SORT.DATE_DESC,
    });
    expect(params.get('types')).toBe('TRANSFER,ATM_WITHDRAWAL');
    expect(params.get('budgetPeriodYear')).toBe('2026');
    expect(params.get('budgetPeriodMonth')).toBe('6');
  });

  it('filtersToApiParams maps expense chip to single type', () => {
    const params = filtersToApiParams({
      year: 2026,
      month: 6,
      typeChip: 'expense',
      sort: TRANSACTION_SORT.DATE_DESC,
    });
    expect(params.get('type')).toBe('EXPENSE');
  });
});
