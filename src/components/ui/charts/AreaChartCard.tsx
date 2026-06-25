'use client';

import { getChartTheme } from '@/lib/charts';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartContainerProps } from './ChartContainer';

export interface AreaChartCardProps extends Omit<ChartContainerProps, 'children'> {
  data: Record<string, string | number>[];
  dataKey: string;
  categoryKey: string;
  seriesIndex?: number;
}

export function AreaChartCard({
  data,
  dataKey,
  categoryKey,
  seriesIndex = 0,
  ...containerProps
}: AreaChartCardProps) {
  const theme = getChartTheme();
  const color = theme.series[seriesIndex] ?? theme.series[0];

  return (
    <ChartContainer {...containerProps}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
