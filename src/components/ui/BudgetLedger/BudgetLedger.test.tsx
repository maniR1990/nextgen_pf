import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { BudgetLedger } from './BudgetLedger';
import samplePayload from './sampleBudgetLedger.json';
import { BudgetLedgerPayloadSchema } from './schemas';

expect.extend(toHaveNoViolations);

const parsed = BudgetLedgerPayloadSchema.parse(samplePayload);

describe('BudgetLedger', () => {
  afterEach(() => cleanup());

  it('renders section headers and summary rows', () => {
    render(<BudgetLedger payload={parsed} />);

    expect(screen.getByRole('region', { name: 'Budget table' })).toBeInTheDocument();
    expect(screen.getAllByText('INCOME').length).toBeGreaterThan(0);
    expect(screen.getByText('TOTAL INVESTMENTS')).toBeInTheDocument();
  });

  it('expands and collapses nested rows', async () => {
    const user = userEvent.setup();
    render(<BudgetLedger payload={parsed} />);

    const toggle = screen.getAllByRole('button', {
      name: /collapse household essentials/i,
    })[0]!;
    await user.click(toggle);
    expect(
      screen.queryAllByRole('button', { name: /collapse groceries & essentials/i }),
    ).toHaveLength(0);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<BudgetLedger payload={parsed} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
