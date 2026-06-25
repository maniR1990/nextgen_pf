import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { KpiBankCashCard } from './KpiBankCashCard';
import { KPI_CARD_DENSITY } from '@/constants/kpiCards';
import { KpiCardRenderer, KpiCardsGrid } from './KpiCardRenderer';
import { KpiCashRunwayCard } from './KpiCashRunwayCard';
import { KpiCcDebtCard } from './KpiCcDebtCard';
import samplePayload from './sampleKpiCards.json';
import { KpiCardsPayloadSchema } from './schemas';

expect.extend(toHaveNoViolations);

const parsedSample = KpiCardsPayloadSchema.parse(samplePayload);

describe('KpiCards', () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
  });

  afterEach(() => cleanup());

  it('renders KpiCashRunwayCard with value, unit, and insight', () => {
    const data = parsedSample.cards.find((c) => c.type === 'cash-runway')!.data;
    render(<KpiCashRunwayCard data={data} />);

    expect(screen.getByRole('heading', { name: data.title })).toBeInTheDocument();
    expect(screen.getByText('2.4')).toBeInTheDocument();
    expect(screen.getByText('mo')).toBeInTheDocument();
    expect(screen.getByText(data.insight)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: `${data.title} progress` })).toBeInTheDocument();
  });

  it('renders KpiBankCashCard with formatted INR amount and trend', () => {
    const data = parsedSample.cards.find((c) => c.type === 'bank-cash')!.data;
    render(<KpiBankCashCard data={data} />);

    expect(screen.getByRole('heading', { name: data.title })).toBeInTheDocument();
    expect(document.querySelector('.kpi-card__value--money')).toHaveTextContent(/₹3,42,000/);
    expect(screen.getByText(/May/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: `${data.title} trend` })).toBeInTheDocument();
  });

  it('renders KpiCcDebtCard with paid-off indicator', () => {
    const data = parsedSample.cards.find((c) => c.type === 'cc-debt')!.data;
    render(<KpiCcDebtCard data={data} />);

    expect(screen.getByRole('heading', { name: data.title })).toBeInTheDocument();
    expect(screen.getByLabelText('Paid off')).toBeInTheDocument();
  });

  it('KpiCardRenderer dispatches all card types from JSON', () => {
    const { container } = render(
      <div>
        {parsedSample.cards.map((item, index) => (
          <KpiCardRenderer key={`${item.type}-${index}`} item={item} />
        ))}
      </div>,
    );

    expect(container.querySelectorAll('.kpi-card')).toHaveLength(6);
  });

  it('KpiCashRunwayCard has no a11y violations', async () => {
    const data = parsedSample.cards.find((c) => c.type === 'cash-runway')!.data;
    const { container } = render(<KpiCashRunwayCard data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('KpiBankCashCard has no a11y violations', async () => {
    const data = parsedSample.cards.find((c) => c.type === 'bank-cash')!.data;
    const { container } = render(<KpiBankCashCard data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies compact density class to cards', () => {
    const data = parsedSample.cards.find((c) => c.type === 'cash-runway')!.data;
    const { container } = render(
      <KpiCashRunwayCard data={data} density={KPI_CARD_DENSITY.COMPACT} />,
    );
    expect(container.querySelector('.kpi-card--compact')).toBeInTheDocument();
  });

  it('KpiCardsGrid renders responsive grid items with span classes', () => {
    const { container } = render(<KpiCardsGrid cards={parsedSample.cards} />);

    expect(container.querySelector('.kpi-dashboard-grid')).toBeInTheDocument();
    expect(container.querySelector('.kpi-dashboard-grid__item--cash-runway')).toBeInTheDocument();
    expect(container.querySelector('.kpi-dashboard-grid--compact')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.kpi-dashboard-grid__item')).toHaveLength(6);
  });

  it('KpiCardsGrid compact mode applies grid and card modifiers', () => {
    const { container } = render(
      <KpiCardsGrid cards={parsedSample.cards} density={KPI_CARD_DENSITY.COMPACT} />,
    );

    expect(container.querySelector('.kpi-dashboard-grid--compact')).toBeInTheDocument();
    expect(container.querySelectorAll('.kpi-card--compact')).toHaveLength(6);
  });
});
