'use client';

import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { TX_TYPE_META } from '@/constants/finance';
import type { TxType } from '@/constants/finance';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Gift,
  Landmark,
  PiggyBank,
  Receipt,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Undo2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  ArrowUpRight,
  Gift,
  Receipt,
  ArrowLeftRight,
  Landmark,
  Undo2,
  Tag,
  Star,
};

// Expense and Income cover most day-to-day logging, so they're the only two
// shown up front. Everything else lives behind "More transaction types" —
// still one tap away, just not competing for attention every time.
const PRIMARY_TYPES: TxType[] = ['EXPENSE', 'INCOME'];

const SECONDARY_TYPES: TxType[] = [
  'TRANSFER',
  'ATM_WITHDRAWAL',
  'INVESTMENT',
  'SINKING_DEPOSIT',
  'GIFT_RECEIVED',
  'REIMBURSEMENT',
  'REFUND',
  'COUPON_REDEMPTION',
  'POINTS_REDEMPTION',
];

interface TypeSelectorProps {
  value: TxType;
  onChange: (type: TxType) => void;
}

function TypeChip({
  type,
  isActive,
  onChange,
}: { type: TxType; isActive: boolean; onChange: (type: TxType) => void }) {
  const meta = TX_TYPE_META[type];
  const Icon = ICON_MAP[meta.icon];
  return (
    <button
      type="button"
      className={[
        'type-selector__chip',
        isActive && 'type-selector__chip--active',
        `type-selector__chip--${meta.amountSign}`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onChange(type)}
      aria-pressed={isActive}
      title={meta.description}
    >
      {Icon && <Icon size={14} />}
      <span>{meta.label}</span>
    </button>
  );
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const isSecondaryActive = SECONDARY_TYPES.includes(value);

  return (
    <div className="type-selector">
      <div className="type-selector__chips">
        {PRIMARY_TYPES.map((type) => (
          <TypeChip key={type} type={type} isActive={value === type} onChange={onChange} />
        ))}
      </div>

      <CollapsibleSection label="More transaction types" defaultOpen={isSecondaryActive}>
        <div className="type-selector__chips">
          {SECONDARY_TYPES.map((type) => (
            <TypeChip key={type} type={type} isActive={value === type} onChange={onChange} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
