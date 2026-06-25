import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SourceBreakdown } from '@/modules/funds/funds.types';
import { Wallet } from 'lucide-react';

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export interface FundAllocationListProps {
  sources: SourceBreakdown[];
  targetAmount: number;
  selectedAccountId: string | null;
  onSelect: (accountId: string) => void;
}

export function FundAllocationList({
  sources,
  targetAmount,
  selectedAccountId,
  onSelect,
}: FundAllocationListProps) {
  return (
    <div className="fund-detail__list-pane">
      <div className="fund-detail__list-header">
        <span className="fund-detail__list-title">Accounts</span>
        <Badge variant="inactive" kind="label">
          {sources.length}
        </Badge>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts allocated"
          description="Use Allocate to link accounts to this fund."
          size="sm"
        />
      ) : (
        <div className="fund-detail__alloc-list">
          {sources.map((src) => {
            const allocationLabel =
              src.type === 'PERCENTAGE'
                ? `${src.value}% of balance`
                : `₹${formatINR(src.value)} fixed`;
            const fillRatio = targetAmount > 0 ? src.allocatedAmount / targetAmount : 0;
            const barPct = Math.min(100, fillRatio * 100);
            const isSelected = selectedAccountId === src.accountId;
            const initials = src.accountName.slice(0, 2).toUpperCase();

            return (
              <button
                key={src.accountId}
                type="button"
                className={[
                  'fund-detail__alloc-row',
                  isSelected && 'fund-detail__alloc-row--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(src.accountId)}
                aria-pressed={isSelected}
                aria-label={`${src.accountName}: ${allocationLabel}, ₹${formatINR(src.allocatedAmount)} allocated`}
              >
                <span className="fund-detail__alloc-avatar" aria-hidden>
                  {initials}
                </span>

                <div className="fund-detail__alloc-info">
                  <span className="fund-detail__alloc-name">{src.accountName}</span>
                  <span className="fund-detail__alloc-meta">{allocationLabel}</span>
                  <div className="fund-detail__alloc-bar" aria-hidden>
                    <div className="fund-detail__alloc-bar-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>

                <div className="fund-detail__alloc-right" aria-hidden>
                  <span className="fund-detail__alloc-amount">
                    ₹{formatINR(src.allocatedAmount)}
                  </span>
                  <span className="fund-detail__alloc-balance">
                    ₹{formatINR(src.accountBalance)} bal
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
