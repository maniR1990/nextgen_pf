/**
 * Chart library entry points — import from `@/lib/charts` in UI only.
 * Services must not depend on chart libraries (SRP).
 */
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export {
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  DonutChart as TremorDonutChart,
} from '@tremor/react';

export type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
