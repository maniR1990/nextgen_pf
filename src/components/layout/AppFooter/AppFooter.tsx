'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/format';
import type { AppFooterConfig, FooterItem } from '@/lib/schemas/appFooter';
import type { AppHeaderData } from '@/lib/schemas/appHeader';

export interface AppFooterProps {
  config: AppFooterConfig;
  data: Pick<AppHeaderData,
    'pendingCount' | 'spendPaceLabel' | 'spendPaceChangePct' | 'unallocated' |
    'nextRecurringLabel' | 'monthClosesLabel'
  >;
  onLogTransaction: () => void;
  onCommandPalette: () => void;
}

function resolveItemValue(item: FooterItem, data: AppFooterProps['data']): string {
  const raw = (data as Record<string, unknown>)[item.dataKey];
  if (raw === undefined || raw === null) return '—';
  if (item.format === 'currency-inr' && typeof raw === 'number') return formatINR(raw);
  if (item.unit && typeof raw === 'number') return `${raw} ${item.unit}`;
  return String(raw);
}

export function AppFooter({ config, data, onLogTransaction, onCommandPalette }: AppFooterProps) {
  const [collapsed, setCollapsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setCollapsed(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCollapsed(true), config.collapseAfterMs);
  }, [config.collapseAfterMs]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setCollapsed(true), config.collapseAfterMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [config.collapseAfterMs]);

  function handleShortcut(action: string) {
    if (action === 'logTransaction') onLogTransaction();
    if (action === 'commandPalette') onCommandPalette();
  }

  return (
    <footer
      className={['app-footer', collapsed && 'app-footer--collapsed'].filter(Boolean).join(' ')}
      onMouseEnter={resetTimer}
      onFocus={resetTimer}
      aria-label="Financial status bar"
    >
      <div className="app-footer__inner">
        <ul className="app-footer__items" role="list">
          {config.items.map((item) => {
            const value = resolveItemValue(item, data);
            const change = item.changeKey
              ? (data as Record<string, unknown>)[item.changeKey] as number | undefined
              : undefined;

            const content = (
              <>
                <span className="app-footer__item-label">{item.label}</span>
                <span className="app-footer__item-value">
                  {value}
                  {item.badge && (
                    <span className="app-footer__badge">{item.badge}</span>
                  )}
                  {change !== undefined && (
                    <span
                      className={[
                        'app-footer__change',
                        change >= 0 ? 'app-footer__change--up' : 'app-footer__change--down',
                      ].join(' ')}
                    >
                      {change >= 0 ? '+' : '−'}{Math.abs(change).toFixed(0)}%
                    </span>
                  )}
                </span>
              </>
            );

            return (
              <li key={item.id} className="app-footer__item">
                {item.href ? (
                  <Link href={item.href} className="app-footer__item-link">
                    {content}
                  </Link>
                ) : (
                  <div className="app-footer__item-static">{content}</div>
                )}
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
