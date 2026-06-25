import type { Meta, StoryObj } from '@storybook/react';
import { KPI_CARD_DENSITY } from '@/constants/kpiCards';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { KpiBankCashCard } from './KpiBankCashCard';
import { KpiCardRenderer, KpiCardsGrid } from './KpiCardRenderer';
import { KpiCashRunwayCard } from './KpiCashRunwayCard';
import { KpiCcDebtCard } from './KpiCcDebtCard';
import { KpiMonthBurnRateCard } from './KpiMonthBurnRateCard';
import { KpiMonthlySurplusCard } from './KpiMonthlySurplusCard';
import { KpiSavingsRateCard } from './KpiSavingsRateCard';
import samplePayload from './sampleKpiCards.json';
import { KpiCardsPayloadSchema } from './schemas';

const parsedSample = KpiCardsPayloadSchema.parse(samplePayload);

const meta: Meta<typeof KpiCashRunwayCard> = {
  title: 'UI/KPI Cards',
  component: KpiCashRunwayCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...chromaticBaseline },
};

export default meta;
type Story = StoryObj<typeof KpiCashRunwayCard>;

const cashRunway = parsedSample.cards.find((c) => c.type === 'cash-runway')!;
const bankCash = parsedSample.cards.find((c) => c.type === 'bank-cash')!;
const monthlySurplus = parsedSample.cards.find((c) => c.type === 'monthly-surplus')!;
const savingsRate = parsedSample.cards.find((c) => c.type === 'savings-rate')!;
const monthBurnRate = parsedSample.cards.find((c) => c.type === 'month-burn-rate')!;
const ccDebt = parsedSample.cards.find((c) => c.type === 'cc-debt')!;

export const CashRunway: Story = {
  render: () => <KpiCashRunwayCard data={cashRunway.data} />,
};

export const BankCash: Story = {
  render: () => <KpiBankCashCard data={bankCash.data} />,
};

export const MonthlySurplus: Story = {
  render: () => <KpiMonthlySurplusCard data={monthlySurplus.data} />,
};

export const SavingsRate: Story = {
  render: () => <KpiSavingsRateCard data={savingsRate.data} />,
};

export const MonthBurnRate: Story = {
  render: () => <KpiMonthBurnRateCard data={monthBurnRate.data} />,
};

export const CcDebt: Story = {
  render: () => <KpiCcDebtCard data={ccDebt.data} />,
};

export const JsonRenderer: Story = {
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(56 * var(--space-4))', padding: 0 }}>
      {parsedSample.cards.map((item, index) => (
        <KpiCardRenderer key={`${item.type}-${index}`} item={item} />
      ))}
    </div>
  ),
};

/** Chromatic baseline — dashboard grid matching design layout */
export const DashboardGrid: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(72 * var(--space-4))', padding: 0 }}>
      <KpiCardsGrid cards={parsedSample.cards} />
    </div>
  ),
};

export const DashboardGridMobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <div style={{ ...storySectionStyle, padding: 'var(--space-4)', maxWidth: '100%' }}>
      <KpiCardsGrid cards={parsedSample.cards} />
    </div>
  ),
};

export const DashboardGridTablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <div style={{ ...storySectionStyle, padding: 'var(--space-4)', maxWidth: '100%' }}>
      <KpiCardsGrid cards={parsedSample.cards} />
    </div>
  ),
};

export const DashboardGridDesktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(72 * var(--space-4))', padding: 0 }}>
      <KpiCardsGrid cards={parsedSample.cards} />
    </div>
  ),
};

export const DashboardGridCompactMobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <div style={{ ...storySectionStyle, padding: 'var(--space-3)', maxWidth: '100%' }}>
      <KpiCardsGrid cards={parsedSample.cards} density={KPI_CARD_DENSITY.COMPACT} />
    </div>
  ),
};

export const DashboardGridCompact: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(72 * var(--space-4))', padding: 0 }}>
      <KpiCardsGrid cards={parsedSample.cards} density={KPI_CARD_DENSITY.COMPACT} />
    </div>
  ),
};
