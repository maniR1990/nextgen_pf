import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BUDGET_LINE_KIND } from '@/constants/budget';
import { BudgetLedgerCategoryCell } from './BudgetLedgerCategoryCell';
import { BudgetPercentBar } from './BudgetPercentBar';
import { formatBudgetMoney } from './formatBudgetMoney';
import type { BudgetTableRow } from './useBudgetLedgerTable';

export interface BudgetLedgerMobileCardProps {
  row: BudgetTableRow;
  editable?: boolean;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export function BudgetLedgerMobileCard({
  row,
  editable = false,
  onEdit,
  onDelete,
}: BudgetLedgerMobileCardProps) {
  const node = row.original;
  const isSection = node.kind === BUDGET_LINE_KIND.SECTION;

  return (
    <article
      className={[
        'budget-ledger__mobile-card',
        isSection && node.variant && `budget-ledger__mobile-card--${node.variant}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <BudgetLedgerCategoryCell row={row} />

      <dl className="budget-ledger__mobile-metrics">
        <div>
          <dt>Planned</dt>
          <dd>{formatBudgetMoney(node.plannedMinor)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{formatBudgetMoney(node.spentMinor)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{formatBudgetMoney(node.remainingMinor)}</dd>
        </div>
      </dl>

      <BudgetPercentBar percent={node.percent} label={`${node.title} budget usage`} />

      {(node.typeLabel || node.note) && (
        <p className="budget-ledger__mobile-notes">
          {node.typeLabel ? <Badge variant="inactive">{node.typeLabel}</Badge> : null}
          {node.note ? <span>{node.note}</span> : null}
        </p>
      )}

      {editable && node.kind !== BUDGET_LINE_KIND.SECTION ? (
        <div className="budget-ledger__mobile-actions">
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit?.(node.id)}>
            Edit
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete?.(node.id)}>
            Delete
          </Button>
        </div>
      ) : null}
    </article>
  );
}
