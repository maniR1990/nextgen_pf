'use client';

import { Card } from '@/components/ui/Card';
import { CHART_DEFAULT_HEIGHT, CHART_MIN_HEIGHT } from '@/constants/charts';
import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

export interface ChartContainerProps {
  title?: string;
  description?: string;
  height?: number;
  children: ReactElement;
  className?: string;
}

export function ChartContainer({
  title,
  description,
  height = CHART_DEFAULT_HEIGHT,
  children,
  className = '',
}: ChartContainerProps) {
  const resolvedHeight = Math.max(height, CHART_MIN_HEIGHT);

  return (
    <Card className={['chart-card', className].filter(Boolean).join(' ')}>
      {(title || description) && (
        <header className="chart-card__header">
          {title ? <h3 className="chart-card__title">{title}</h3> : null}
          {description ? <p className="chart-card__description">{description}</p> : null}
        </header>
      )}
      <div className="chart-card__body" style={{ height: resolvedHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
