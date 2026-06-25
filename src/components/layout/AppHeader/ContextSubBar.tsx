'use client';

import type { ContextSubBarItem } from '@/lib/schemas/appHeader';
import type { AppHeaderData } from '@/lib/schemas/appHeader';
import { formatINR } from '@/lib/utils/format';
import Link from 'next/link';

interface ContextSubBarProps {
  items: ContextSubBarItem[];
  data: AppHeaderData;
}

function resolveValue(item: ContextSubBarItem, data: AppHeaderData): string {
  const raw = data[item.dataKey as keyof AppHeaderData];
  if (raw === undefined || raw === null) return '—';
  if (item.format === 'currency-inr' && typeof raw === 'number') return formatINR(raw);
  if (item.unit && typeof raw === 'number') return `${raw} ${item.unit}`;
  return String(raw);
}

export function ContextSubBar({ items, data }: ContextSubBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="context-sub-bar" role="complementary" aria-label="Screen context">
      <ul className="context-sub-bar__list" role="list">
        {items.map((item, i) => {
          const value = resolveValue(item, data);
          const change = item.changeKey
            ? (data[item.changeKey as keyof AppHeaderData] as number | undefined)
            : undefined;

          const inner = (
            <>
              <span className="context-sub-bar__label">{item.label}</span>
              <span className="context-sub-bar__value">
                {value}
                {item.badge && <span className="context-sub-bar__badge">{item.badge}</span>}
                {change !== undefined && (
                  <span
                    className={[
                      'context-sub-bar__change',
                      change >= 0 ? 'context-sub-bar__change--up' : 'context-sub-bar__change--down',
                    ].join(' ')}
                  >
                    {change >= 0 ? '+' : '−'}
                    {Math.abs(change).toFixed(0)}%
                  </span>
                )}
              </span>
            </>
          );

          return (
            <li key={item.id} className="context-sub-bar__item">
              {i > 0 && <span className="context-sub-bar__sep" aria-hidden="true" />}
              {item.href ? (
                <Link href={item.href} className="context-sub-bar__link">
                  {inner}
                </Link>
              ) : (
                <div className="context-sub-bar__static">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
