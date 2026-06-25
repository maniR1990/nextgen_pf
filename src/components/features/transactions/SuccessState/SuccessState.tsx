'use client';

import { TX_TYPE_META } from '@/constants/finance';
import type { SuccessData } from '@/store/transactionFormStore';
import { CheckCircle } from 'lucide-react';

interface SuccessStateProps {
  data: SuccessData;
  onLogAnother: () => void;
  onClose: () => void;
}

export function SuccessState({ data, onLogAnother, onClose }: SuccessStateProps) {
  const meta = TX_TYPE_META[data.type];
  const signClass =
    meta.amountSign === 'debit'
      ? 'success-state__amount--debit'
      : meta.amountSign === 'credit'
        ? 'success-state__amount--credit'
        : '';

  return (
    <div className="success-state" role="status" aria-live="polite">
      <div className="success-state__icon-wrap">
        <CheckCircle className="success-state__icon" size={48} aria-hidden />
      </div>

      <h2 className="success-state__heading">Transaction logged!</h2>

      <div className="success-state__card">
        <div className="success-state__row">
          <span className="success-state__field">Type</span>
          <span className="success-state__value">{meta.label}</span>
        </div>
        <div className="success-state__row">
          <span className="success-state__field">Amount</span>
          <span className={['success-state__value success-state__amount', signClass].join(' ')}>
            {data.amount}
          </span>
        </div>
        <div className="success-state__row">
          <span className="success-state__field">Merchant</span>
          <span className="success-state__value">{data.merchant}</span>
        </div>
        <div className="success-state__row">
          <span className="success-state__field">Date</span>
          <span className="success-state__value">{data.date}</span>
        </div>
        <div className="success-state__row">
          <span className="success-state__field">Method</span>
          <span className="success-state__value">{data.method}</span>
        </div>
        {data.categoryLabel && (
          <div className="success-state__row">
            <span className="success-state__field">Budget</span>
            <span className="success-state__value">{data.budgetPeriodLabel}</span>
          </div>
        )}
      </div>

      <div className="success-state__actions">
        <button type="button" className="btn btn--primary" onClick={onLogAnother}>
          Log Another
        </button>
        <a href="/dashboard/transactions" className="btn btn--ghost" onClick={onClose}>
          View Transactions
        </a>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
