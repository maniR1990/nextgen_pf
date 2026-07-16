'use client';

import { useDashboardSubscriptions } from '@/hooks/useDashboardSubscriptions';

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  TWICE_MONTHLY: 'Twice monthly',
  EVERY_2_MONTHS: 'Every 2 months',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-yearly',
  ANNUAL: 'Annual',
};

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function renewalLabel(iso: string): string {
  const [, month, day] = iso.split('-');
  const d = new Date(Number(iso.slice(0, 4)), Number(month) - 1, Number(day));
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function headline(deltaPct: number, priceIncreaseCount: number): string {
  if (deltaPct === 0) return 'Recurring costs are steady this cycle.';
  const direction = deltaPct > 0 ? 'up' : 'down';
  const increaseClause =
    deltaPct > 0 && priceIncreaseCount > 0
      ? ` — driven by ${priceIncreaseCount} price increase${priceIncreaseCount === 1 ? '' : 's'}`
      : '';
  return `Recurring costs are ${direction} ${Math.abs(deltaPct)}% this cycle${increaseClause}.`;
}

export function SubscriptionAuditWidget() {
  const { data, isLoading, isError } = useDashboardSubscriptions();

  if (isLoading) {
    return (
      <div className="card subscription-audit-widget">
        <p className="subscription-audit-widget__status">Loading subscriptions…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card subscription-audit-widget">
        <p className="subscription-audit-widget__status">Couldn't load subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="card subscription-audit-widget">
      <p className="subscription-audit-widget__headline">
        {headline(data.deltaPct, data.priceIncreases.length)}
      </p>

      <div className="subscription-audit-widget__total">
        <span className="subscription-audit-widget__total-value">{money(data.monthlyTotal)}</span>
        <span className="subscription-audit-widget__total-sub">
          {money(data.annualizedTotal)}/yr
          {data.percentOfSpend !== null && ` · ${data.percentOfSpend}% of monthly spend`}
        </span>
      </div>

      {data.subscriptions.length > 0 && (
        <div className="subscription-audit-widget__list">
          {data.subscriptions.map((s) => (
            <div key={s.id} className="subscription-audit-widget__row">
              <div className="subscription-audit-widget__row-info">
                <span className="subscription-audit-widget__row-name">{s.name}</span>
                <span className="subscription-audit-widget__row-meta">
                  {FREQUENCY_LABELS[s.frequency] ?? s.frequency} · renews {renewalLabel(s.nextRenewal)}
                </span>
              </div>
              <div className="subscription-audit-widget__row-amount">
                {s.previousAmount !== null && (
                  <>
                    <span className="subscription-audit-widget__old-amount">
                      {money(s.previousAmount)}
                    </span>
                    <span className="badge badge--error">
                      +{money(s.amount - s.previousAmount)}
                    </span>
                  </>
                )}
                <span>{money(s.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(data.byCategory.length > 0 || data.byAccount.length > 0) && (
        <div className="subscription-audit-widget__breakdown">
          {data.byCategory.length > 0 && (
            <div className="subscription-audit-widget__breakdown-group">
              <p className="subscription-audit-widget__section-label">By category</p>
              {data.byCategory.map((row) => (
                <div key={row.label} className="subscription-audit-widget__breakdown-row">
                  <span>{row.label}</span>
                  <span>{money(row.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {data.byAccount.length > 0 && (
            <div className="subscription-audit-widget__breakdown-group">
              <p className="subscription-audit-widget__section-label">By account</p>
              {data.byAccount.map((row) => (
                <div key={row.label} className="subscription-audit-widget__breakdown-row">
                  <span>{row.label}</span>
                  <span>{money(row.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
