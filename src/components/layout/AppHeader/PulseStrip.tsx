'use client';

import type { PulseMetric } from '@/lib/schemas/appHeader';
import type { AppHeaderData } from '@/lib/schemas/appHeader';
import { formatChangePct } from '@/lib/utils/format';
import { formatMetricValue } from '@/lib/utils/pulseMetric';

interface PulseStripProps {
  metrics: PulseMetric[];
  marketSymbols: string[];
  marketLabels: Record<string, string>;
  data: AppHeaderData;
  collapsed: boolean;
}

export function PulseStrip({
  metrics,
  marketSymbols,
  marketLabels,
  data,
  collapsed,
}: PulseStripProps) {
  return (
    <div
      className={['pulse-strip', collapsed && 'pulse-strip--collapsed'].filter(Boolean).join(' ')}
      aria-hidden={collapsed}
    >
      <div className="pulse-strip__metrics">
        {metrics.map((m) => {
          const value = formatMetricValue(m, data);
          const change = m.changeKey
            ? (data[m.changeKey as keyof AppHeaderData] as number | undefined)
            : undefined;
          const meta = m.metaKey ? String(data[m.metaKey as keyof AppHeaderData] ?? '') : undefined;
          // Suppress the alert for a brand-new user with no accounts yet — ₹0 there means
          // "you haven't started," not "something needs your attention."
          const isZeroAlert = m.alertWhenZero && value === '₹0' && data.hasAccounts !== false;

          return (
            <div key={m.id} className="pulse-strip__metric">
              <span className="pulse-strip__metric-label">{m.label}</span>
              <span
                className={[
                  'pulse-strip__metric-value',
                  isZeroAlert && 'pulse-strip__metric-value--alert',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {value}
                {m.unit && <span className="pulse-strip__metric-unit"> {m.unit}</span>}
              </span>
              {change !== undefined && (
                <span
                  className={[
                    'pulse-strip__metric-change',
                    change >= 0
                      ? 'pulse-strip__metric-change--up'
                      : 'pulse-strip__metric-change--down',
                  ].join(' ')}
                >
                  {formatChangePct(change)}
                </span>
              )}
              {meta && <span className="pulse-strip__metric-meta">{meta}</span>}
            </div>
          );
        })}
      </div>

      <div className="pulse-strip__ticker" aria-label="Market data">
        {marketSymbols.map((sym) => {
          const entry = data.market?.[sym];
          if (!entry) return null;
          const label = marketLabels[sym] ?? sym;
          return (
            <div key={sym} className="pulse-strip__ticker-item">
              <span className="pulse-strip__ticker-label">{label}</span>
              <span className="pulse-strip__ticker-value">
                {entry.value.toLocaleString('en-IN')}
              </span>
              <span
                className={[
                  'pulse-strip__ticker-change',
                  entry.changePct >= 0
                    ? 'pulse-strip__ticker-change--up'
                    : 'pulse-strip__ticker-change--down',
                ].join(' ')}
              >
                {formatChangePct(entry.changePct)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
