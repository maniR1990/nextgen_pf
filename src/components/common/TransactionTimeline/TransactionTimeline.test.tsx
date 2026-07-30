import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  describe('edit / delete actions', () => {
    // Deliberately a different year/month than "today" — the point of this whole
    // block is that action visibility must not depend on the real-world current
    // month, only on whether the caller passed a handler. This used to be gated by
    // an `isCurrentPeriod` check that made every transaction outside the actual
    // current calendar month permanently uneditable, including the common case of
    // fixing a transaction someone accidentally logged under the wrong month.
    const OLD_PERIOD_GROUPS: TimelineGroup[] = [
      {
        date: '2020-01-05',
        transactions: [
          {
            id: 'tx-old',
            merchant: 'Old Merchant',
            category: 'Groceries',
            method: 'UPI',
            amount: 500,
            type: 'debit',
            budgetPeriodYear: 2020,
            budgetPeriodMonth: 1,
          },
        ],
      },
    ];

    it('shows edit and delete buttons for a transaction from a past budget period when handlers are provided', () => {
      render(
        <TransactionTimeline
          groups={OLD_PERIOD_GROUPS}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />,
      );
      expect(screen.getByLabelText('Edit Old Merchant')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Old Merchant')).toBeInTheDocument();
    });

    it('does not show any action buttons when neither handler is provided', () => {
      render(<TransactionTimeline groups={OLD_PERIOD_GROUPS} />);
      expect(screen.queryByLabelText('Edit Old Merchant')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Delete Old Merchant')).not.toBeInTheDocument();
    });

    it('calls onEditClick with the transaction id, without triggering onTransactionClick', () => {
      const onEditClick = vi.fn();
      const onTransactionClick = vi.fn();
      render(
        <TransactionTimeline
          groups={OLD_PERIOD_GROUPS}
          onEditClick={onEditClick}
          onTransactionClick={onTransactionClick}
        />,
      );
      fireEvent.click(screen.getByLabelText('Edit Old Merchant'));
      expect(onEditClick).toHaveBeenCalledWith('tx-old');
      expect(onTransactionClick).not.toHaveBeenCalled();
    });

    it('calls onDeleteClick with the transaction id', () => {
      const onDeleteClick = vi.fn();
      render(<TransactionTimeline groups={OLD_PERIOD_GROUPS} onDeleteClick={onDeleteClick} />);
      fireEvent.click(screen.getByLabelText('Delete Old Merchant'));
      expect(onDeleteClick).toHaveBeenCalledWith('tx-old');
    });
  });
});
