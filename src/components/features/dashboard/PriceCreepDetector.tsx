'use client';

import { useDashboardSubscriptions } from '@/hooks/useDashboardSubscriptions';

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// A separate, more visually punchy widget from the subscription-audit list — this is
// the specific "gotcha" moment worth surfacing on its own, not buried in a full list.
// Returns nothing at all (not even a loading/error card) when there's nothing to show,
// since SubscriptionAuditWidget already covers loading/error state for this same data.
export function PriceCreepDetector() {
  const { data, isLoading, isError } = useDashboardSubscriptions();

  if (isLoading || isError || !data || data.priceIncreases.length === 0) {
    return null;
  }

  return (
    <div className="card price-creep-detector">
      <p className="price-creep-detector__title">Price increases this cycle</p>
      {data.priceIncreases.map((inc) => (
        <div key={inc.id} className="price-creep-detector__item">
          <span className="price-creep-detector__name">{inc.name}</span>
          <div className="price-creep-detector__prices">
            <span className="price-creep-detector__old-price">{money(inc.oldAmount)}</span>
            <span className="price-creep-detector__new-price">{money(inc.newAmount)}</span>
          </div>
          <span className="badge badge--error">
            +{inc.deltaPct}% · +{money(inc.deltaAmount)}/month
          </span>
          <span className="price-creep-detector__meta">
            First charged this amount on {formatDate(inc.changedDate)}
          </span>
        </div>
      ))}
    </div>
  );
}
