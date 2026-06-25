import type { BadgeVariant } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Briefcase, type LucideIcon, ShoppingCart, Tv, Zap } from 'lucide-react';
import { getCellValue } from './dataTableUtils';
import type { DataTableColumnDef } from './types';

const TRANSACTION_ICONS: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  briefcase: Briefcase,
  tv: Tv,
  zap: Zap,
};

const DEFAULT_BADGE_VARIANT: BadgeVariant = 'inactive';

const CATEGORY_VARIANTS: Record<string, BadgeVariant> = {
  Food: 'warning',
  Income: 'success',
  Subscription: 'active',
  Utilities: 'inactive',
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  Completed: 'success',
  Pending: 'warning',
  Failed: 'error',
};

function resolveBadgeVariant<T extends Record<string, unknown>>(
  column: DataTableColumnDef<T>,
  row: T,
  label: string,
): BadgeVariant {
  if (column.badgeVariantKey) {
    const variant = row[column.badgeVariantKey];
    if (typeof variant === 'string') return variant as BadgeVariant;
  }
  if (column.key === 'category') return CATEGORY_VARIANTS[label] ?? DEFAULT_BADGE_VARIANT;
  if (column.key === 'status') return STATUS_VARIANTS[label] ?? DEFAULT_BADGE_VARIANT;
  return DEFAULT_BADGE_VARIANT;
}

function formatAmount(value: unknown) {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(num)) return String(value ?? '');
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = num >= 0 ? '+' : '-';
  return `${prefix}$${formatted}`;
}

export function renderDataTableCell<T extends Record<string, unknown>>(
  row: T,
  column: DataTableColumnDef<T>,
) {
  if (column.render) return column.render(row);

  const value = getCellValue(row, column);
  const type = column.type ?? 'text';

  switch (type) {
    case 'transaction': {
      const iconName = column.iconKey ? String(row[column.iconKey] ?? '') : '';
      const IconComponent = TRANSACTION_ICONS[iconName] ?? ShoppingCart;
      return (
        <span className="data-table__transaction">
          <Icon
            icon={IconComponent}
            size="sm"
            tone="muted"
            className="data-table__transaction-icon"
          />
          <span className="data-table__transaction-label">{String(value ?? '')}</span>
        </span>
      );
    }
    case 'badge': {
      const label = String(value ?? '');
      return <Badge variant={resolveBadgeVariant(column, row, label)}>{label}</Badge>;
    }
    case 'amount': {
      const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
      const tone = num >= 0 ? 'data-table__amount--positive' : 'data-table__amount--negative';
      return <span className={['data-table__amount', tone].join(' ')}>{formatAmount(value)}</span>;
    }
    case 'date':
    case 'text':
    default:
      return <span>{String(value ?? '')}</span>;
  }
}
