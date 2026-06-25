import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { TIMELINE_DENSITY } from '@/constants/timeline';
import { Timeline } from './Timeline';
import auditSample from './samples/audit.timeline.json';
import milestoneSample from './samples/milestone.timeline.json';
import transactionSample from './samples/transaction.timeline.json';
import { TimelineConfigSchema } from './schemas';

expect.extend(toHaveNoViolations);

const transactionConfig = TimelineConfigSchema.parse(transactionSample);
const milestoneConfig = TimelineConfigSchema.parse(milestoneSample);
const auditConfig = TimelineConfigSchema.parse(auditSample);

describe('Timeline', () => {
  afterEach(() => cleanup());

  it('renders ordered list with items from JSON config', () => {
    render(<Timeline config={transactionConfig} />);

    expect(screen.getByRole('list', { name: transactionConfig.ariaLabel })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(transactionConfig.items.length);
    expect(screen.getByText('Direct Deposit')).toBeInTheDocument();
    expect(screen.getByText('Rent Payment')).toBeInTheDocument();
  });

  it('renders timestamp, description, and amount labels', () => {
    render(<Timeline config={transactionConfig} />);

    expect(screen.getByText('Today • 2:14 PM')).toBeInTheDocument();
    expect(screen.getByText('ACME Corp • Payroll')).toBeInTheDocument();
    expect(screen.getByText('+$3,200.00')).toBeInTheDocument();
    expect(screen.getByText('-$1,850.00')).toBeInTheDocument();
  });

  it('applies tone classes to nodes and amount chips', () => {
    const { container } = render(<Timeline config={transactionConfig} />);

    expect(container.querySelector('.timeline__node--success')).toBeInTheDocument();
    expect(container.querySelector('.timeline__node--error')).toBeInTheDocument();
    expect(container.querySelector('.timeline__amount--warning')).toBeInTheDocument();
  });

  it('renders projected milestone with hollow muted node', () => {
    const { container } = render(<Timeline config={milestoneConfig} />);

    expect(screen.getByText('Goal Complete')).toBeInTheDocument();
    expect(screen.getByText('Projected')).toBeInTheDocument();
    expect(container.querySelector('.timeline__node--projected')).toBeInTheDocument();
  });

  it('renders optional link action', () => {
    render(<Timeline config={transactionConfig} />);

    const link = screen.getByRole('link', { name: 'PDF available' });
    expect(link).toHaveAttribute('href', '#statement-pdf');
  });

  it('applies compact density modifier', () => {
    const { container } = render(
      <Timeline config={auditConfig} density={TIMELINE_DENSITY.COMPACT} />,
    );

    expect(container.querySelector('.timeline--compact')).toBeInTheDocument();
    expect(container.querySelector('.timeline--audit')).toBeInTheDocument();
  });

  it('has no a11y violations for transaction timeline', async () => {
    const { container } = render(<Timeline config={transactionConfig} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
