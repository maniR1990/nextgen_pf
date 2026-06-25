import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { BUDGET_ENTRY_TAG, BUDGET_LINE_KIND } from '@/constants/budget';
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import type { BudgetLedgerNodeJson } from './schemas';
import type { BudgetTableRow } from './useBudgetLedgerTable';

const TAG_VARIANT = {
  [BUDGET_ENTRY_TAG.MANUAL]: 'warning',
  [BUDGET_ENTRY_TAG.AUTO]: 'active',
} as const;

export interface BudgetLedgerCategoryCellProps {
  row: BudgetTableRow;
}

export function BudgetLedgerCategoryCell({ row }: BudgetLedgerCategoryCellProps) {
  const node = row.original;
  const isSection = node.kind === BUDGET_LINE_KIND.SECTION;
  const isLine = node.kind === BUDGET_LINE_KIND.LINE;
  const canExpand = row.getCanExpand();

  return (
    <div
      className={[
        'budget-ledger__category',
        isSection && 'budget-ledger__category--section',
        node.variant && `budget-ledger__category--${node.variant}`,
        isLine && 'budget-ledger__category--line',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ paddingInlineStart: `calc(${row.depth} * var(--comp-budget-indent-step))` }}
    >
      {canExpand ? (
        <button
          type="button"
          className="budget-ledger__expand"
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          aria-label={row.getIsExpanded() ? `Collapse ${node.title}` : `Expand ${node.title}`}
        >
          <Icon
            icon={row.getIsExpanded() ? ChevronDown : ChevronRight}
            size="sm"
            tone="inherit"
            aria-hidden
          />
        </button>
      ) : isLine ? (
        <span className="budget-ledger__line-marker" aria-hidden>
          <Icon icon={CornerDownRight} size="xs" tone="muted" aria-hidden />
        </span>
      ) : (
        <span className="budget-ledger__expand-spacer" aria-hidden />
      )}

      <div className="budget-ledger__category-copy">
        <div className="budget-ledger__category-title-row">
          <span className="budget-ledger__category-title">{node.title}</span>
          {node.tag ? (
            <Badge variant={TAG_VARIANT[node.tag as keyof typeof TAG_VARIANT]}>
              {node.tag.toUpperCase()}
            </Badge>
          ) : null}
        </div>
        {node.note ? <span className="budget-ledger__category-note">{node.note}</span> : null}
      </div>
    </div>
  );
}

export function budgetSectionRowClassName(node: BudgetLedgerNodeJson): string {
  if (node.kind !== BUDGET_LINE_KIND.SECTION || !node.variant) return '';
  return `budget-ledger__section-row--${node.variant}`;
}
