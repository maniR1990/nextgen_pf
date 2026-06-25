'use client';

import { TX_TYPE_GROUPS, TX_TYPE_META } from '@/constants/finance';
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

const GROUP_LABELS: Record<keyof typeof TX_TYPE_GROUPS, string> = {
  OUTFLOW: 'Outflow',
  INFLOW: 'Inflow',
  MOVEMENT: 'Movement',
  ADJUSTMENT: 'Adjustment',
};

interface TypeSelectorProps {
  value: TxType;
  onChange: (type: TxType) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="type-selector">
      {(Object.entries(TX_TYPE_GROUPS) as [keyof typeof TX_TYPE_GROUPS, readonly string[]][]).map(
        ([group, types]) => (
          <div key={group} className="type-selector__group">
            <span className="type-selector__group-label">{GROUP_LABELS[group]}</span>
            <div className="type-selector__chips">
              {types.map((type) => {
                const meta = TX_TYPE_META[type as TxType];
                const Icon = ICON_MAP[meta.icon];
                const isActive = value === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={[
                      'type-selector__chip',
                      isActive && 'type-selector__chip--active',
                      `type-selector__chip--${meta.amountSign}`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onChange(type as TxType)}
                    aria-pressed={isActive}
                    title={meta.description}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
