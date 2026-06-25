import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AreaChartCard } from './AreaChartCard';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

const sampleTrend = [
  { month: 'Jan', balance: 1200 },
  { month: 'Feb', balance: 1450 },
  { month: 'Mar', balance: 1320 },
];

describe('ChartContainer', () => {
  it('renders chart card with title and responsive wrapper', () => {
    render(
      <AreaChartCard
        title="Account balance"
        data={sampleTrend}
        dataKey="balance"
        categoryKey="month"
      />,
    );

    expect(screen.getByText('Account balance')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
