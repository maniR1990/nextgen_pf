import type { CategoryFlowTypeSlug } from '@/constants/categories';
import type { AccountSideSlug, HierarchyVariant } from '@/constants/settings';

export const CATEGORY_HIERARCHY_MAX_LEVEL = 2;

export const ACCOUNT_HIERARCHY_MAX_LEVEL = 1;

export const CATEGORY_HIERARCHY_LEVEL_LABELS = {
  0: 'GROUP',
  1: 'L1',
  2: 'L2',
} as const;

export const ACCOUNT_HIERARCHY_LEVEL_LABELS = {
  0: 'GROUP',
  1: 'ACCOUNT',
  2: '',
} as const;

export const CATEGORY_HIERARCHY_ADD_LABELS = {
  0: 'Add category',
  1: 'Add subcategory',
} as const;

export const ACCOUNT_HIERARCHY_ADD_LABELS = {
  0: 'Add group',
  1: 'Add account',
} as const;

export const CATEGORY_HIERARCHY_DEFAULT_ARIA_LABEL = 'Category hierarchy';

export const ACCOUNT_HIERARCHY_DEFAULT_ARIA_LABEL = 'Account hierarchy';

export const CATEGORY_HIERARCHY_TYPE_TONES: Record<
  CategoryFlowTypeSlug,
  'success' | 'error' | 'accent' | 'neutral'
> = {
  income: 'success',
  expense: 'error',
  investment: 'accent',
  transfer: 'neutral',
};

export const ACCOUNT_HIERARCHY_TYPE_TONES: Record<AccountSideSlug, 'success' | 'error'> = {
  asset: 'success',
  liability: 'error',
};

export const CATEGORY_HIERARCHY_TYPE_ICON_KEYS = {
  income: 'banknote',
  expense: 'shopping-bag',
  investment: 'trending-up',
  transfer: 'arrow-left-right',
} as const satisfies Record<CategoryFlowTypeSlug, string>;

export const ACCOUNT_HIERARCHY_TYPE_ICON_KEYS = {
  asset: 'landmark',
  liability: 'credit-card',
} as const satisfies Record<AccountSideSlug, string>;

export type HierarchyRootType = CategoryFlowTypeSlug | AccountSideSlug;

export interface HierarchyMeta {
  variant: HierarchyVariant;
  maxLevel: number;
  levelLabels: Record<0 | 1 | 2, string>;
  addLabels: Record<0 | 1, string>;
  defaultAriaLabel: string;
}

export function getHierarchyMeta(variant: HierarchyVariant = 'category'): HierarchyMeta {
  if (variant === 'account') {
    return {
      variant,
      maxLevel: ACCOUNT_HIERARCHY_MAX_LEVEL,
      levelLabels: ACCOUNT_HIERARCHY_LEVEL_LABELS,
      addLabels: ACCOUNT_HIERARCHY_ADD_LABELS,
      defaultAriaLabel: ACCOUNT_HIERARCHY_DEFAULT_ARIA_LABEL,
    };
  }

  return {
    variant,
    maxLevel: CATEGORY_HIERARCHY_MAX_LEVEL,
    levelLabels: CATEGORY_HIERARCHY_LEVEL_LABELS,
    addLabels: CATEGORY_HIERARCHY_ADD_LABELS,
    defaultAriaLabel: CATEGORY_HIERARCHY_DEFAULT_ARIA_LABEL,
  };
}

export function getHierarchyTypeTone(
  variant: HierarchyVariant,
  rootType: HierarchyRootType,
  level: 0 | 1 | 2,
): 'success' | 'error' | 'accent' | 'neutral' {
  if (variant === 'account') {
    if (level === 1) return 'neutral';
    return ACCOUNT_HIERARCHY_TYPE_TONES[rootType as AccountSideSlug] ?? 'neutral';
  }

  if (level === 2) return 'neutral';
  return CATEGORY_HIERARCHY_TYPE_TONES[rootType as CategoryFlowTypeSlug] ?? 'neutral';
}
