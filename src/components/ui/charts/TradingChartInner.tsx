'use client';

import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '@/constants/charts';
import { ColorType, type IChartApi, type Time, createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export interface TradingChartPoint {
  time: string;
  value: number;
}

export interface TradingChartInnerProps {
  data: TradingChartPoint[];
  height?: number;
}

export function TradingChartInner({ data, height = 320 }: TradingChartInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: CHART_AXIS_COLOR,
      },
      grid: {
        vertLines: { color: CHART_GRID_COLOR },
        horzLines: { color: CHART_GRID_COLOR },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const series = chart.addAreaSeries({
      lineColor: 'var(--comp-chart-series-1)',
      topColor: 'color-mix(in srgb, var(--comp-chart-series-1) 35%, transparent)',
      bottomColor: 'color-mix(in srgb, var(--comp-chart-series-1) 5%, transparent)',
    });

    series.setData(
      data.map((point) => ({
        time: point.time as Time,
        value: point.value,
      })),
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return <div ref={containerRef} className="trading-chart" data-testid="trading-chart" />;
}
