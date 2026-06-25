'use client';

import { getChartTheme, getSeriesColor } from '@/lib/charts';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { ChartContainer, type ChartContainerProps } from './ChartContainer';

export interface DonutChartCardProps extends Omit<ChartContainerProps, 'children'> {
  data: { name: string; value: number }[];
  dataKey?: string;
  nameKey?: string;
}

export function DonutChartCard({
  data,
  dataKey = 'value',
  nameKey = 'name',
  ...containerProps
}: DonutChartCardProps) {
  const theme = getChartTheme();

  return (
    <ChartContainer {...containerProps}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: theme.tooltip.background,
            border: `1px solid ${theme.tooltip.border}`,
            color: theme.tooltip.text,
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getSeriesColor(index)} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
