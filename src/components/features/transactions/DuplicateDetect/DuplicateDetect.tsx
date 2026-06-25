'use client';

import { AlertTriangle, X } from 'lucide-react';
import type { DuplicateMatch } from '@/types/finance';

interface DuplicateDetectProps {
  duplicate: DuplicateMatch;
  onDismiss: () => void;
}

export function DuplicateDetect({ duplicate, onDismiss }: DuplicateDetectProps) {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const date = new Date(duplicate.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="duplicate-detect" role="alert">
      <div className="duplicate-detect__header">
        <AlertTriangle size={16} className="duplicate-detect__icon" />
        <span className="duplicate-detect__title">Possible duplicate detected</span>
        <button
          type="button"
          className="duplicate-detect__close"
          onClick={onDismiss}
          aria-label="Dismiss duplicate warning"
        >
          <X size={14} />
        </button>
      </div>
      <p className="duplicate-detect__body">
        A similar transaction was logged on <strong>{date}</strong> — {fmt(duplicate.amount)} at{' '}
        <strong>{duplicate.merchant}</strong> via {duplicate.sourceLabel}.
      </p>
      <div className="duplicate-detect__actions">
        <button type="button" className="duplicate-detect__btn--dismiss" onClick={onDismiss}>
          Yes, log anyway
        </button>
        <a className="duplicate-detect__link" href={`/dashboard/transactions/${duplicate.id}`}>
          View original
        </a>
      </div>
    </div>
  );
}
