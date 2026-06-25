import type { AccountGroupType } from '@prisma/client';

export const ACCOUNT_GROUP_TYPES = ['ASSET', 'LIABILITY'] as const;

export type AccountGroupTypeSlug = 'asset' | 'liability';

export const ACCOUNT_GROUP_SORT_OPTIONS = [
  'order_asc',
  'order_desc',
  'name_asc',
  'name_desc',
  'balance_desc',
  'created_desc',
] as const;

export type AccountGroupSort = (typeof ACCOUNT_GROUP_SORT_OPTIONS)[number];

export const ACCOUNT_GROUP_TYPE_LABELS: Record<AccountGroupType, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
};

/** Map API slug → Prisma enum */
export function toAccountGroupType(slug: AccountGroupTypeSlug): AccountGroupType {
  return slug === 'liability' ? 'LIABILITY' : 'ASSET';
}

export function fromAccountGroupType(type: AccountGroupType): AccountGroupTypeSlug {
  return type === 'LIABILITY' ? 'liability' : 'asset';
}
