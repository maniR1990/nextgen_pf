'use client';

import { useScrollCollapse } from '@/hooks/useScrollCollapse';
import type { AppFooterConfig } from '@/lib/schemas/appFooter';
import type { AppHeaderData, PulseMetric } from '@/lib/schemas/appHeader';
import { formatChangePct } from '@/lib/utils/format';
import { formatMetricValue } from '@/lib/utils/pulseMetric';

export interface AppFooterProps {
  config: AppFooterConfig;
  metrics: PulseMetric[];
  collapseAfterScrollPx: number;
  data: AppHeaderData;
  onLogTransaction: () => void;
  onCommandPalette: () => void;
}

export function AppFooter({
  config,
  metrics,
  collapseAfterScrollPx,
  data,
  onLogTransaction,
  onCommandPalette,
}: AppFooterProps) {
  // The pulse strip up top hides once the user scrolls past this threshold — the
  // footer is its stand-in for that state, so it only expands exactly when the strip
  // is gone. Same numbers, one place on screen at a time, never both.
  const pulseStripHidden = useScrollCollapse(collapseAfterScrollPx);
  const collapsed = !pulseStripHidden;

  function handleShortcut(action: string) {
    if (action === 'logTransaction') onLogTransaction();
    if (action === 'commandPalette') onCommandPalette();
  }

  return (
    <footer
      className={['app-footer', collapsed && 'app-footer--collapsed'].filter(Boolean).join(' ')}
      aria-label="Financial status bar"
      aria-hidden={collapsed}
    >
      <div className="app-footer__inner">
        <ul className="app-footer__items">
          {metrics.map((metric) => {
            const value = formatMetricValue(metric, data);
            const change = metric.changeKey
              ? (data[metric.changeKey as keyof AppHeaderData] as number | undefined)
              : undefined;
            const meta = metric.metaKey
              ? String(data[metric.metaKey as keyof AppHeaderData] ?? '')
              : undefined;
            const isZeroAlert = metric.alertWhenZero && value === '₹0';

            const content = (
              <>
                <span className="app-footer__item-label">{metric.label}</span>
                <span
                  className={[
                    'app-footer__item-value',
                    isZeroAlert && 'app-footer__item-value--alert',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {value}
                  {metric.unit && <span> {metric.unit}</span>}
                  {change !== undefined && (
                    <span
                      className={[
                        'app-footer__change',
                        change >= 0 ? 'app-footer__change--up' : 'app-footer__change--down',
                      ].join(' ')}
                    >
                      {formatChangePct(change)}
                    </span>
                  )}
                </span>
                {meta && <span className="app-footer__item-meta">{meta}</span>}
              </>
            );

            return (
              <li key={metric.id} className="app-footer__item">
                <div className="app-footer__item-static">{content}</div>
              </li>
            );
          })}
        </ul>

        <div className="app-footer__shortcuts">
          {config.shortcuts.map((sc) => (
            <button
              key={sc.id}
              type="button"
              className="app-footer__shortcut"
              onClick={() => handleShortcut(sc.action)}
              aria-label={sc.label}
            >
              <kbd className="app-footer__kbd">{sc.key}</kbd>
              <span className="app-footer__shortcut-label">{sc.label}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
