import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransactionTimeline } from './TransactionTimeline';
import type { TimelineGroup } from './TransactionTimeline';

afterEach(() => cleanup());

const GROUPS: TimelineGroup[] = [
  {
    date: '2026-06-13',
    transactions: [
      {
        id: '1',
        merchant: 'Zepto',
        category: 'Groceries',
        method: 'UPI',
        amount: 890,
        type: 'debit',
      },
      {
        id: '2',
        merchant: 'HDFC Salary',
        category: 'Income',
        method: 'NEFT',
        amount: 85000,
        type: 'credit',
      },
    ],
  },
  {
    date: '2026-06-12',
    transactions: [
      {
        id: '3',
        merchant: 'Netflix',
        category: 'Entertainment',
        method: 'Card',
        amount: 649,
        type: 'debit',
      },
    ],
  },
];

describe('TransactionTimeline', () => {
  describe('rendering', () => {
    it('renders transaction merchants', () => {
      render(<TransactionTimeline groups={GROUPS} />);
      expect(screen.getByText('Zepto')).toBeInTheDocument();
      expect(screen.getByText('HDFC Salary')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    it('renders date group labels', () => {
      render(<TransactionTimeline groups={GROUPS} />);
      expect(screen.getByText(/Sat, Jun 13/i)).toBeInTheDocument();
      expect(screen.getByText(/Fri, Jun 12/i)).toBeInTheDocument();
    });

    it('renders category and method tags', () => {
      render(<TransactionTimeline groups={GROUPS} />);
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('· UPI')).toBeInTheDocument();
    });

    it('formats debit amount with minus sign', () => {
      render(<TransactionTimeline groups={GROUPS} />);
      expect(screen.getByText('−₹890')).toBeInTheDocument();
    });

    it('formats credit amount with plus sign', () => {
      render(<TransactionTimeline groups={GROUPS} />);
      expect(screen.getByText('+₹85,000')).toBeInTheDocument();
    });

    it('shows loading skeletons when loading=true', () => {
      render(<TransactionTimeline groups={[]} loading />);
      expect(screen.getByLabelText(/loading transactions/i)).toBeInTheDocument();
    });

    it('shows empty state when no groups', () => {
      render(<TransactionTimeline groups={[]} />);
      expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
    });
  });

  describe('infinite scroll', () => {
    it('renders a scroll sentinel when hasMore=true', () => {
      const { container } = render(
        <TransactionTimeline groups={GROUPS} hasMore onLoadMore={vi.fn()} />,
      );
      expect(container.querySelector('.tx-timeline__sentinel')).toBeInTheDocument();
    });

    it('does not render a sentinel when hasMore=false', () => {
      const { container } = render(
        <TransactionTimeline groups={GROUPS} hasMore={false} onLoadMore={vi.fn()} />,
      );
      expect(container.querySelector('.tx-timeline__sentinel')).not.toBeInTheDocument();
    });

    it('shows a loading status while fetching the next page', () => {
      render(<TransactionTimeline groups={GROUPS} hasMore loadingMore onLoadMore={vi.fn()} />);
      expect(screen.getByRole('status')).toHaveTextContent(/loading more/i);
    });

    it('shows an end-of-list message once there is nothing left to load', () => {
      render(<TransactionTimeline groups={GROUPS} hasMore={false} />);
      expect(screen.getByRole('status')).toHaveTextContent(/reached the end/i);
    });

    it('does not show the end-of-list message when the list is empty', () => {
      render(<TransactionTimeline groups={[]} hasMore={false} />);
      expect(screen.queryByText(/reached the end/i)).not.toBeInTheDocument();
    });
  });
});
