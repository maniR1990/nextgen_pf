'use client';

import { getChartTheme } from '@/lib/charts';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartContainerProps } from './ChartContainer';

export interface BarChartCardProps extends Omit<ChartContainerProps, 'children'> {
  data: Record<string, string | number>[];
  dataKey: string;
  categoryKey: string;
  seriesIndex?: number;
}

export function BarChartCard({
  data,
  dataKey,
  categoryKey,
  seriesIndex = 0,
  ...containerProps
}: BarChartCardProps) {
  const theme = getChartTheme();
  const color = theme.series[seriesIndex] ?? theme.series[0];

  return (
    <ChartContainer {...containerProps}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={categoryKey}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: theme.tooltip.background,
            border: `1px solid ${theme.tooltip.border}`,
            color: theme.tooltip.text,
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
