export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const;

export const PROJECT_SORT_OPTIONS = [
  'created_desc',
  'name_asc',
  'name_desc',
  'target_desc',
] as const;

export type ProjectSort = (typeof PROJECT_SORT_OPTIONS)[number];
