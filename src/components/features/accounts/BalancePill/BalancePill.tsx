'use client';

import type { HTMLAttributes } from 'react';

export interface BalancePillProps extends HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function BalancePill({
  amount,
  currency = 'INR',
  size = 'md',
  className = '',
  ...props
}: BalancePillProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  const sizeClass = size === 'sm' ? 'balance-pill--sm' : size === 'lg' ? 'balance-pill--lg' : '';
  const signClass = isPositive
    ? 'balance-pill--positive'
    : isNegative
      ? 'balance-pill--negative'
      : '';

  return (
    <span
      data-testid="balance-pill"
      className={['balance-pill', signClass, sizeClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      <span className="balance-pill__symbol" aria-hidden>
        {currency === 'INR' ? '₹' : currency}
      </span>
      {isNegative && (
        <span className="balance-pill__sign" aria-hidden>
          −
        </span>
      )}
      <span className="balance-pill__amount">{formatINR(amount)}</span>
    </span>
  );
}
