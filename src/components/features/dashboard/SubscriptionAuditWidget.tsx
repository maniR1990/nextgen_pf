'use client';

import type {
  BreakdownRow,
  SubscriptionItem,
} from '@/app/api/v1/dashboard/subscriptions/derive';
import { useDashboardSubscriptions } from '@/hooks/useDashboardSubscriptions';
import { monthlyEquivalent } from '@/lib/utils/recurringFrequency';
import type { RecurringFrequency } from '@prisma/client';
import { ChevronDown, Tag } from 'lucide-react';
import { useState } from 'react';

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  TWICE_MONTHLY: 'Twice monthly',
  EVERY_2_MONTHS: 'Every 2 months',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-yearly',
  ANNUAL: 'Annual',
};

// Shortest cadence first — matches how a user thinks about "what's due soon" scaling
// up to "what's a once-a-year lump sum".
const FREQUENCY_ORDER = [
  'MONTHLY',
  'TWICE_MONTHLY',
  'EVERY_2_MONTHS',
  'QUARTERLY',
  'HALF_YEARLY',
  'ANNUAL',
];

type ListView = 'date' | 'cycle';
type AmountUnit = 'monthly' | 'yearly';

interface CycleGroup {
  frequency: string;
  items: SubscriptionItem[];
  subtotal: number;
}

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

function groupByCycle(subscriptions: SubscriptionItem[]): CycleGroup[] {
  const groups = new Map<string, SubscriptionItem[]>();
  for (const s of subscriptions) {
    const list = groups.get(s.frequency);
    if (list) list.push(s);
    else groups.set(s.frequency, [s]);
  }
  return FREQUENCY_ORDER.filter((f) => groups.has(f)).map((frequency) => {
    const items = groups.get(frequency)!;
    const subtotal = items.reduce(
      (sum, s) => sum + monthlyEquivalent(s.amount, frequency as RecurringFrequency),
      0,
    );
    return { frequency, items, subtotal };
  });
}

function Row({ s, showFrequency = true }: { s: SubscriptionItem; showFrequency?: boolean }) {
  return (
    <div className="subscription-audit-widget__row">
      <div className="subscription-audit-widget__row-info">
        <span className="subscription-audit-widget__row-name">{s.name}</span>
        <span className="subscription-audit-widget__row-meta">
          {showFrequency && `${FREQUENCY_LABELS[s.frequency] ?? s.frequency} · `}renews{' '}
          {renewalLabel(s.nextRenewal)}
        </span>
      </div>
      <div className="subscription-audit-widget__row-amount">
        <div className="subscription-audit-widget__row-amount-main">
          {s.previousAmount !== null && (
            <>
              <span className="subscription-audit-widget__old-amount">
                {money(s.previousAmount)}
              </span>
              <span className="badge badge--error">+{money(s.amount - s.previousAmount)}</span>
            </>
          )}
          <span>{money(s.amount)}</span>
        </div>
        {/* The raw amount above is what you're actually charged on the renewal date
            (e.g. a full ₹72,000 once a year) — this is its share of the smoothed
            monthly total shown at the top of the card, so a big annual or half-yearly
            charge doesn't read as disconnected from that figure. */}
        {s.frequency !== 'MONTHLY' && (
          <span className="subscription-audit-widget__row-monthly">
            ≈{money(monthlyEquivalent(s.amount, s.frequency as RecurringFrequency))}/mo
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryCard({
  row,
  items,
  unit,
  isOpen,
  onToggle,
}: {
  row: BreakdownRow;
  items: SubscriptionItem[];
  unit: AmountUnit;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="subscription-audit-widget__catcard">
      <button
        type="button"
        className="subscription-audit-widget__cat-head"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="subscription-audit-widget__cat-icon">
          <Tag size={13} aria-hidden />
        </span>
        <span className="subscription-audit-widget__cat-info">
          <span className="subscription-audit-widget__cat-name">{row.label}</span>
          <span className="subscription-audit-widget__cat-count">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </span>
        <span className="subscription-audit-widget__cat-amt">
          {money(unit === 'monthly' ? row.amount : row.amount * 12)}
        </span>
        <ChevronDown
          size={14}
          className={`subscription-audit-widget__cat-chev${isOpen ? ' subscription-audit-widget__cat-chev--open' : ''}`}
          aria-hidden
        />
      </button>
      <div
        className={`subscription-audit-widget__cat-wrap${isOpen ? ' subscription-audit-widget__cat-wrap--open' : ''}`}
      >
        <div className="subscription-audit-widget__cat-items">
          {items.map((s) => (
            <div key={s.id} className="subscription-audit-widget__cat-item">
              <span>{s.name}</span>
              <span>{money(s.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SubscriptionAuditWidget() {
  const { data, isLoading, isError } = useDashboardSubscriptions();
  const [listView, setListView] = useState<ListView>('date');
  const [categoryUnit, setCategoryUnit] = useState<AmountUnit>('monthly');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

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
        <span>
          <span className="subscription-audit-widget__total-value">{money(data.monthlyTotal)}</span>
          <span className="subscription-audit-widget__total-unit"> / month</span>
        </span>
        <span className="subscription-audit-widget__total-sub">
          {money(data.annualizedTotal)}/yr
          {data.percentOfSpend !== null && ` · ${data.percentOfSpend}% of monthly spend`}
        </span>
      </div>

      {data.subscriptions.length > 0 && (
        <div className="subscription-audit-widget__section">
          <div className="subscription-audit-widget__section-header">
            <p className="subscription-audit-widget__section-label">Bills</p>
            <div className="subscription-audit-widget__toggle">
              <button
                type="button"
                aria-pressed={listView === 'date'}
                className={`subscription-audit-widget__toggle-btn${listView === 'date' ? ' subscription-audit-widget__toggle-btn--active' : ''}`}
                onClick={() => setListView('date')}
              >
                By date
              </button>
              <button
                type="button"
                aria-pressed={listView === 'cycle'}
                className={`subscription-audit-widget__toggle-btn${listView === 'cycle' ? ' subscription-audit-widget__toggle-btn--active' : ''}`}
                onClick={() => setListView('cycle')}
              >
                By cycle
              </button>
            </div>
          </div>

          <div className="subscription-audit-widget__list">
            {listView === 'date'
              ? data.subscriptions.map((s) => <Row key={s.id} s={s} />)
              : groupByCycle(data.subscriptions).map((group) => (
                  <div key={group.frequency}>
                    <div className="subscription-audit-widget__cycle-heading">
                      <span>{FREQUENCY_LABELS[group.frequency] ?? group.frequency}</span>
                      <span>{money(group.subtotal)}/mo</span>
                    </div>
                    {group.items.map((s) => (
                      <Row key={s.id} s={s} showFrequency={false} />
                    ))}
                  </div>
                ))}
          </div>
        </div>
      )}

      {data.byCategory.length > 0 && (
        <div className="subscription-audit-widget__section">
          <div className="subscription-audit-widget__section-header">
            <p className="subscription-audit-widget__section-label">By category</p>
            <div className="subscription-audit-widget__toggle">
              <button
                type="button"
                aria-pressed={categoryUnit === 'monthly'}
                className={`subscription-audit-widget__toggle-btn${categoryUnit === 'monthly' ? ' subscription-audit-widget__toggle-btn--active' : ''}`}
                onClick={() => setCategoryUnit('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={categoryUnit === 'yearly'}
                className={`subscription-audit-widget__toggle-btn${categoryUnit === 'yearly' ? ' subscription-audit-widget__toggle-btn--active' : ''}`}
                onClick={() => setCategoryUnit('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="subscription-audit-widget__categories">
            {data.byCategory.map((row) => (
              <CategoryCard
                key={row.label}
                row={row}
                items={data.subscriptions.filter((s) => s.categoryName === row.label)}
                unit={categoryUnit}
                isOpen={openCategory === row.label}
                onToggle={() => setOpenCategory(openCategory === row.label ? null : row.label)}
              />
            ))}
          </div>
        </div>
      )}

      {data.byAccount.length > 0 && (
        <div className="subscription-audit-widget__section">
          <p className="subscription-audit-widget__section-label">By account</p>
          <div className="subscription-audit-widget__breakdown-group">
            {data.byAccount.map((row) => (
              <div key={row.label} className="subscription-audit-widget__breakdown-row">
                <span>{row.label}</span>
                <span>{money(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
