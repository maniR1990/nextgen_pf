'use client';

import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export interface UnallocatedCashAlertProps {
  amount: number;
  onAllocate?: () => void;
  className?: string;
}

export function UnallocatedCashAlert({
  amount,
  onAllocate,
  className = '',
}: UnallocatedCashAlertProps) {
  if (amount <= 0) return null;

  return (
    <div role="alert" className={['unallocated-cash-alert', className].filter(Boolean).join(' ')}>
      <AlertTriangle size={16} className="unallocated-cash-alert__icon" aria-hidden />
      <span className="unallocated-cash-alert__message">
        ₹{formatINR(amount)} in idle cash not assigned to any bucket
      </span>
      {onAllocate && (
        <Button variant="ghost" size="sm" onClick={onAllocate}>
          Allocate now
        </Button>
      )}
    </div>
  );
}
