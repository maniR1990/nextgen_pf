import type { z } from 'zod';
import { formatBudgetMoney } from './formatBudgetMoney';
import type { BudgetSummaryRowSchema } from './schemas';

export type BudgetSummaryRowJson = z.infer<typeof BudgetSummaryRowSchema>;

export interface BudgetLedgerSummariesProps {
  summaries: BudgetSummaryRowJson[];
}

export function BudgetLedgerSummaries({ summaries }: BudgetLedgerSummariesProps) {
  return (
    <div className="budget-ledger__summaries" role="region" aria-label="Budget totals">
      {summaries.map((summary) => (
        <div
          key={summary.id}
          className={[
            'budget-ledger__summary-row',
            summary.tone && `budget-ledger__summary-row--${summary.tone}`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="budget-ledger__summary-title">{summary.title}</span>
          <div className="budget-ledger__summary-values">
            <span>
              <span className="budget-ledger__summary-label">Planned</span>
              {formatBudgetMoney(summary.plannedMinor)}
            </span>
            <span className="budget-ledger__summary-sep" aria-hidden>
              |
            </span>
            <span>
              <span className="budget-ledger__summary-label">Spent</span>
              {formatBudgetMoney(summary.spentMinor)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
