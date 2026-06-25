import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { YearHeatmap } from './YearHeatmap';
import type { HeatmapDay } from './YearHeatmap';

const chromatic = { chromatic: { disableSnapshot: false } };

function generateSampleData(year: number): HeatmapDay[] {
  const data: HeatmapDay[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (Math.random() > 0.4) {
      data.push({
        date: d.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 100,
      });
    }
  }
  return data;
}

const SAMPLE_DATA = generateSampleData(2026);

const meta: Meta<typeof YearHeatmap> = {
  title: 'Common/YearHeatmap',
  component: YearHeatmap,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromatic },
  args: { year: 2026, data: SAMPLE_DATA },
};

export default meta;
type Story = StoryObj<typeof YearHeatmap>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { data: [] },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'lg' }, ...chromatic },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' }, ...chromatic },
};

export const DarkMode: Story = {
  parameters: { ...chromatic, backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)' }}>
        <Story />
      </div>
    ),
  ],
};

export const ClickDay: Story = {
  args: { onDayClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const cells = canvas.getAllByRole('button');
    if (cells.length > 0) {
      await userEvent.click(cells[0]);
      await expect(args.onDayClick).toHaveBeenCalledOnce();
    }
  },
};
