'use client';

import { BalancePill } from '../BalancePill';

export interface NetWorthBannerProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency?: string;
  className?: string;
}

export function NetWorthBanner({
  totalAssets,
  totalLiabilities,
  netWorth,
  currency = 'INR',
  className = '',
}: NetWorthBannerProps) {
  return (
    <div
      className={['net-worth-banner', className].filter(Boolean).join(' ')}
      aria-label="Net worth summary"
    >
      <div className="net-worth-banner__stat">
        <span className="net-worth-banner__label">Total Assets</span>
        <BalancePill amount={totalAssets} currency={currency} size="lg" />
      </div>
      <span className="net-worth-banner__divider" aria-hidden>
        −
      </span>
      <div className="net-worth-banner__stat">
        <span className="net-worth-banner__label">Total Liabilities</span>
        <BalancePill amount={totalLiabilities} currency={currency} size="lg" />
      </div>
      <span className="net-worth-banner__divider" aria-hidden>
        =
      </span>
      <div className="net-worth-banner__stat net-worth-banner__stat--net">
        <span className="net-worth-banner__label">Net Worth</span>
        <BalancePill amount={netWorth} currency={currency} size="lg" />
      </div>
    </div>
  );
}
