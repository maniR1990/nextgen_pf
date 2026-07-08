export const HIERARCHY_VARIANTS = ['category', 'account'] as const;

export type HierarchyVariant = (typeof HIERARCHY_VARIANTS)[number];

export const HIERARCHY_DEFAULT_VARIANT: HierarchyVariant = 'category';

export const ACCOUNT_SIDE_TYPES = ['asset', 'liability'] as const;

export type AccountSideSlug = (typeof ACCOUNT_SIDE_TYPES)[number];

export const SETTINGS_DEFAULT_TAB_ID = 'accounts';

export const SETTINGS_PANEL_TYPES = ['hierarchy'] as const;

export type SettingsPanelType = (typeof SETTINGS_PANEL_TYPES)[number];

export const HIERARCHY_DENSITIES = ['comfortable', 'compact'] as const;

export type HierarchyDensity = (typeof HIERARCHY_DENSITIES)[number];

export const HIERARCHY_CRUD_MODES = ['inline', 'menu'] as const;

export type HierarchyCrudMode = (typeof HIERARCHY_CRUD_MODES)[number];

export const SETTINGS_DEFAULT_ARIA_LABEL = 'Settings sections';

export const SETTINGS_TAB_QUERY_KEY = 'tab';

export const SETTINGS_TOAST_CREATE_SUCCESS = 'Category created';
export const SETTINGS_TOAST_CREATE_ERROR = 'Could not create category';
export const SETTINGS_TOAST_UPDATE_SUCCESS = 'Category updated';
export const SETTINGS_TOAST_UPDATE_ERROR = 'Could not update category';
export const SETTINGS_TOAST_DELETE_SUCCESS = 'Category deleted';
export const SETTINGS_TOAST_ARCHIVE_SUCCESS = 'Category archived — history preserved';
export const SETTINGS_TOAST_DELETE_ERROR = 'Could not delete category';
export const SETTINGS_TOAST_LOAD_ERROR = 'Could not load categories';

export const SETTINGS_ACCOUNT_TOAST_CREATE_SUCCESS = 'Account created';
export const SETTINGS_ACCOUNT_TOAST_CREATE_ERROR = 'Could not create account';
export const SETTINGS_ACCOUNT_TOAST_UPDATE_SUCCESS = 'Account updated';
export const SETTINGS_ACCOUNT_TOAST_UPDATE_ERROR = 'Could not update account';
export const SETTINGS_ACCOUNT_TOAST_DELETE_SUCCESS = 'Account archived';
export const SETTINGS_ACCOUNT_TOAST_DELETE_ERROR = 'Could not archive account';
export const SETTINGS_ACCOUNT_TOAST_LOAD_ERROR = 'Could not load accounts';
