'use client';

import {
  ACCOUNT_TAXONOMY_GROUPS,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_META,
  type AccountTypeMeta,
} from '@/constants/accounts';
import type { AccountType } from '@prisma/client';

const TYPE_ICONS: Partial<Record<string, string>> = {
  banking: '🏦',
  cash: '💵',
  wallets: '👛',
  investment: '📈',
  alternate: '🏅',
  rewards: '🎁',
  liabilities: '💳',
};

export interface AccountTypeGridProps {
  selected?: AccountType;
  onSelect: (type: AccountType) => void;
}

export function AccountTypeGrid({ selected, onSelect }: AccountTypeGridProps) {
  return (
    <div className="account-type-grid">
      {ACCOUNT_TAXONOMY_GROUPS.map((group) => {
        const typesInGroup = ACCOUNT_TYPES.filter((t) => ACCOUNT_TYPE_META[t].group === group.slug);
        if (typesInGroup.length === 0) return null;

        return (
          <section key={group.slug} className="account-type-grid__group">
            <h3 className="account-type-grid__group-label">
              <span aria-hidden>{TYPE_ICONS[group.slug]}</span>
              {group.label}
            </h3>
            <div className="account-type-grid__cards">
              {typesInGroup.map((type) => {
                const meta = ACCOUNT_TYPE_META[type] as AccountTypeMeta;
                const isSelected = selected === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-label={meta.name}
                    aria-pressed={isSelected}
                    className={[
                      'account-type-grid__card',
                      isSelected && 'account-type-grid__card--selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onSelect(type)}
                  >
                    <span className="account-type-grid__card-prefix" aria-hidden>
                      {meta.codePrefix}
                    </span>
                    <span className="account-type-grid__card-name">{meta.name}</span>
                    {meta.taxBenefit && (
                      <span
                        className="account-type-grid__card-tax"
                        title="80C tax benefit"
                        aria-label="Tax benefit"
                      >
                        80C
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
