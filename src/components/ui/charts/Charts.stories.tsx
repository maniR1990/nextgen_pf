import { chromaticBaseline, storyGridStyle, storySectionStyle } from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { AreaChartCard } from './AreaChartCard';
import { BarChartCard } from './BarChartCard';
import { DonutChartCard } from './DonutChartCard';
import { TradingChart } from './TradingChart';

const trendData = [
  { month: 'Jan', balance: 4200 },
  { month: 'Feb', balance: 4800 },
  { month: 'Mar', balance: 4510 },
  { month: 'Apr', balance: 5120 },
  { month: 'May', balance: 4980 },
  { month: 'Jun', balance: 5300 },
];

const categoryData = [
  { category: 'Housing', amount: 1800 },
  { category: 'Food', amount: 620 },
  { category: 'Transport', amount: 340 },
  { category: 'Savings', amount: 900 },
];

const allocationData = [
  { name: 'Stocks', value: 45 },
  { name: 'Bonds', value: 25 },
  { name: 'Cash', value: 15 },
  { name: 'Alternatives', value: 15 },
];

const tradingData = [
  { time: '2024-01-02', value: 100 },
  { time: '2024-01-09', value: 102.4 },
  { time: '2024-01-16', value: 101.2 },
  { time: '2024-01-23', value: 104.8 },
  { time: '2024-01-30', value: 106.1 },
];

const meta: Meta = {
  title: 'UI/Charts',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div style={storySectionStyle}>
      <div style={storyGridStyle}>
        <AreaChartCard
          title="Net worth trend"
          description="Last 6 months"
          data={trendData}
          dataKey="balance"
          categoryKey="month"
        />
        <BarChartCard
          title="Monthly spend"
          description="By category"
          data={categoryData}
          dataKey="amount"
          categoryKey="category"
          seriesIndex={1}
        />
        <DonutChartCard
          title="Portfolio allocation"
          description="Current mix"
          data={allocationData}
        />
      </div>
    </div>
  ),
};

export const AreaChart: Story = {
  render: () => (
    <AreaChartCard title="Net worth trend" data={trendData} dataKey="balance" categoryKey="month" />
  ),
  parameters: chromaticBaseline,
};

export const BarChart: Story = {
  render: () => (
    <BarChartCard
      title="Monthly spend"
      data={categoryData}
      dataKey="amount"
      categoryKey="category"
      seriesIndex={2}
    />
  ),
  parameters: chromaticBaseline,
};

export const DonutChart: Story = {
  render: () => <DonutChartCard title="Portfolio allocation" data={allocationData} />,
  parameters: chromaticBaseline,
};

export const TradingChartStory: Story = {
  name: 'Trading Chart',
  render: () => (
    <TradingChart
      title="Index performance"
      description="Weekly close (demo)"
      data={tradingData}
      height={300}
    />
  ),
  parameters: chromaticBaseline,
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ ...storySectionStyle, gap: 'var(--space-8)' }}>
      <AreaChartCard title="Area" data={trendData} dataKey="balance" categoryKey="month" />
      <BarChartCard title="Bar" data={categoryData} dataKey="amount" categoryKey="category" />
      <DonutChartCard title="Donut" data={allocationData} />
      <TradingChart title="Trading" data={tradingData} height={260} />
    </div>
  ),
  parameters: chromaticBaseline,
};
