'use client';

import { Card } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import type { TradingChartInnerProps } from './TradingChartInner';

const TradingChartInner = dynamic(
  () => import('./TradingChartInner').then((mod) => mod.TradingChartInner),
  {
    ssr: false,
    loading: () => <div className="trading-chart trading-chart--loading">Loading chart…</div>,
  },
);

export interface TradingChartProps extends TradingChartInnerProps {
  title?: string;
  description?: string;
}

export function TradingChart({ title, description, ...chartProps }: TradingChartProps) {
  return (
    <Card className="chart-card trading-chart-card">
      {(title || description) && (
        <header className="chart-card__header">
          {title ? <h3 className="chart-card__title">{title}</h3> : null}
          {description ? <p className="chart-card__description">{description}</p> : null}
        </header>
      )}
      <TradingChartInner {...chartProps} />
    </Card>
  );
}
