import {
  Bell,
  CreditCard,
  Home,
  LineChart,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react';

/** Canonical app navigation / shell icons — Lucide only */
export const AppIcons = {
  home: Home,
  card: CreditCard,
  chart: LineChart,
  bell: Bell,
  settings: Settings,
  profile: User,
} as const satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof AppIcons;
