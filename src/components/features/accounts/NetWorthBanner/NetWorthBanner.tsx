'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { BalancePill } from '../BalancePill';

export interface NetWorthBannerProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency?: string;
  className?: string;
}

const HIDDEN = '••••••';

export function NetWorthBanner({
  totalAssets,
  totalLiabilities,
  netWorth,
  currency = 'INR',
  className = '',
}: NetWorthBannerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={['net-worth-banner', className].filter(Boolean).join(' ')}
      aria-label="Net worth summary"
    >
      <div className="net-worth-banner__stat">
        <span className="net-worth-banner__label">Total Assets</span>
        {visible ? (
          <BalancePill amount={totalAssets} currency={currency} size="lg" />
        ) : (
          <span className="net-worth-banner__hidden">{HIDDEN}</span>
        )}
      </div>
      <span className="net-worth-banner__divider" aria-hidden>
        −
      </span>
      <div className="net-worth-banner__stat">
        <span className="net-worth-banner__label">Total Liabilities</span>
        {visible ? (
          <BalancePill amount={totalLiabilities} currency={currency} size="lg" />
        ) : (
          <span className="net-worth-banner__hidden">{HIDDEN}</span>
        )}
      </div>
      <span className="net-worth-banner__divider" aria-hidden>
        =
      </span>
      <div className="net-worth-banner__stat net-worth-banner__stat--net">
        <span className="net-worth-banner__label">Net Worth</span>
        {visible ? (
          <BalancePill amount={netWorth} currency={currency} size="lg" />
        ) : (
          <span className="net-worth-banner__hidden">{HIDDEN}</span>
        )}
      </div>

      <button
        type="button"
        className="net-worth-banner__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide balances' : 'Show balances'}
        style={{ marginLeft: 'auto' }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
