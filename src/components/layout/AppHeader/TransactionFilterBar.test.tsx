import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionFilterBar } from './TransactionFilterBar';

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams('year=2026&month=6');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/dashboard/transactions',
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/query/fetcher', () => ({
  apiGetV1: vi.fn().mockResolvedValue([
    { id: 'ps1', name: 'HDFC Salary', type: 'BANK_SALARY', balance: 0 },
  ]),
}));

function renderBar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TransactionFilterBar />
    </QueryClientProvider>,
  );
}

describe('TransactionFilterBar', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  afterEach(() => cleanup());

  it('renders type filter chips', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Income' })).toBeInTheDocument();
  });

  it('updates URL when expense chip is selected', () => {
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Expense' }));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('type=expense'),
      expect.objectContaining({ scroll: false }),
    );
  });

  it('renders account filter with all accounts default', () => {
    renderBar();
    expect(screen.getByLabelText('Filter by account')).toHaveValue('all');
  });

  it('renders sort control', () => {
    renderBar();
    expect(screen.getAllByRole('button', { name: /sort by date/i }).length).toBeGreaterThan(0);
  });
});
