import { Icon } from '@/components/ui/Icon';
import type { HierarchyRootType } from '@/constants/category-hierarchy';
import {
  ACCOUNT_HIERARCHY_TYPE_ICON_KEYS,
  CATEGORY_HIERARCHY_TYPE_ICON_KEYS,
  getHierarchyMeta,
} from '@/constants/category-hierarchy';
import type { HierarchyVariant } from '@/constants/settings';
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CreditCard,
  Gift,
  Home,
  Landmark,
  Lightbulb,
  LineChart,
  type LucideIcon,
  Package,
  ShoppingBag,
  Sprout,
  Store,
  TrendingUp,
} from 'lucide-react';
import type { CategoryHierarchyNodeJson } from '../schemas';

const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  'arrow-left-right': ArrowLeftRight,
  banknote: Banknote,
  'building-2': Building2,
  'credit-card': CreditCard,
  gift: Gift,
  home: Home,
  landmark: Landmark,
  lightbulb: Lightbulb,
  'line-chart': LineChart,
  package: Package,
  'shopping-bag': ShoppingBag,
  sprout: Sprout,
  store: Store,
  'trending-up': TrendingUp,
};

export function resolveLucideIcon(
  name?: string,
  variant: HierarchyVariant = 'category',
  fallbackType?: HierarchyRootType,
): LucideIcon {
  if (name && LUCIDE_ICON_MAP[name]) {
    return LUCIDE_ICON_MAP[name];
  }

  if (fallbackType) {
    const keys =
      variant === 'account' ? ACCOUNT_HIERARCHY_TYPE_ICON_KEYS : CATEGORY_HIERARCHY_TYPE_ICON_KEYS;
    const key = keys[fallbackType as keyof typeof keys];
    return LUCIDE_ICON_MAP[key as string] ?? Banknote;
  }

  return Banknote;
}

export function CategoryHierarchyIcon({
  node,
  groupType,
  variant = 'category',
}: {
  node: CategoryHierarchyNodeJson;
  groupType?: HierarchyRootType;
  variant?: HierarchyVariant;
}) {
  const rootType = (node.level === 0 ? node.type : groupType) as HierarchyRootType | undefined;

  if (node.emoji) {
    return (
      <span className="cat-hierarchy__emoji" aria-hidden>
        {node.emoji}
      </span>
    );
  }

  const LucideComponent = resolveLucideIcon(node.icon, variant, rootType);

  return (
    <Icon icon={LucideComponent} size="sm" tone="inherit" className="cat-hierarchy__lucide-icon" />
  );
}

export function getDefaultRootType(variant: HierarchyVariant): HierarchyRootType {
  const meta = getHierarchyMeta(variant);
  return variant === 'account' ? 'asset' : 'income';
}
