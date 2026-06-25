import {
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_SERIES_VARS,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '@/constants/charts';

export interface ChartTheme {
  series: readonly string[];
  grid: string;
  axis: string;
  tooltip: {
    background: string;
    border: string;
    text: string;
  };
}

/** Design-token chart palette — CSS variables, safe for SSR markup. */
export function getChartTheme(): ChartTheme {
  return {
    series: CHART_SERIES_VARS,
    grid: CHART_GRID_COLOR,
    axis: CHART_AXIS_COLOR,
    tooltip: {
      background: CHART_TOOLTIP_BG,
      border: CHART_TOOLTIP_BORDER,
      text: CHART_TOOLTIP_TEXT,
    },
  };
}

export function getSeriesColor(index: number): string {
  const { series } = getChartTheme();
  return series[index % series.length] ?? series[0];
}
