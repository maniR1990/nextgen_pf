'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export interface KpiMiniDonutProps {
  percent: number;
  ariaLabel: string;
}

export function KpiMiniDonut({ percent, ariaLabel }: KpiMiniDonutProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const data = [
    { name: 'rate', value: clamped },
    { name: 'remainder', value: 100 - clamped },
  ];

  return (
    <div className="kpi-donut" role="img" aria-label={ariaLabel}>
      <div className="kpi-donut__chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="var(--comp-kpi-donut-fill)" />
              <Cell fill="var(--comp-kpi-donut-track)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <span className="kpi-donut__center" aria-hidden>
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
