/** JSON-serializable Lucide icon keys for SideMenu config */
export const SIDE_MENU_ICON = {
  INDIAN_RUPEE: 'indian-rupee',
  LAYOUT_GRID: 'layout-grid',
  BAR_CHART: 'bar-chart',
  LIST: 'list',
  LANDMARK: 'landmark',
  PIGGY_BANK: 'piggy-bank',
  CALENDAR: 'calendar',
  REFRESH: 'refresh-cw',
} as const;

export type SideMenuIconKey = (typeof SIDE_MENU_ICON)[keyof typeof SIDE_MENU_ICON];

export const SIDE_MENU_ICON_VALUES = Object.values(SIDE_MENU_ICON);

export const SIDE_MENU_WIDTH = {
  COLLAPSED: 'calc(16 * var(--space-1))',
  EXPANDED: 'var(--grid-sidebar-width)',
} as const;
