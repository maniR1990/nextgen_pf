import { SIDE_MENU_ICON, type SideMenuIconKey } from '@/constants/sideMenu';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  Landmark,
  LayoutGrid,
  List,
  type LucideIcon,
  PiggyBank,
  RefreshCw,
} from 'lucide-react';

const ICON_MAP: Record<SideMenuIconKey, LucideIcon> = {
  [SIDE_MENU_ICON.INDIAN_RUPEE]: IndianRupee,
  [SIDE_MENU_ICON.LAYOUT_GRID]: LayoutGrid,
  [SIDE_MENU_ICON.BAR_CHART]: BarChart3,
  [SIDE_MENU_ICON.LIST]: List,
  [SIDE_MENU_ICON.LANDMARK]: Landmark,
  [SIDE_MENU_ICON.PIGGY_BANK]: PiggyBank,
  [SIDE_MENU_ICON.CALENDAR]: Calendar,
  [SIDE_MENU_ICON.REFRESH]: RefreshCw,
};

export function resolveSideMenuIcon(key: string): LucideIcon {
  return ICON_MAP[key as SideMenuIconKey] ?? LayoutGrid;
}
