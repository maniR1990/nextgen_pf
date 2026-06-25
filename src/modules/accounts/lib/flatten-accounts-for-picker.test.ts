import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import { describe, expect, it } from 'vitest';
import { flattenAccountsForPicker } from './flatten-accounts-for-picker';

const groups: AccountGroupWithAccounts[] = [
  {
    id: 'g1',
    name: 'Banking',
    type: 'ASSET',
    slug: 'banking',
    order: 0,
    icon: null,
    color: null,
    isDefault: false,
    isCollapsed: false,
    accounts: [
      {
        id: 'a1',
        name: 'HDFC Salary',
        code: 'HDFC-01',
        type: 'BANK_SALARY',
        subtype: null,
        balance: 50000,
        currency: 'INR',
        status: 'ACTIVE',
        isPrimary: true,
        isExcludeNetWorth: false,
        isHidden: false,
        institutionId: null,
        groupId: 'g1',
        archivedAt: null,
      },
      {
        id: 'a2',
        name: 'Hidden',
        code: 'HID-01',
        type: 'BANK_SAVINGS',
        subtype: null,
        balance: 0,
        currency: 'INR',
        status: 'ACTIVE',
        isPrimary: false,
        isExcludeNetWorth: false,
        isHidden: true,
        institutionId: null,
        groupId: 'g1',
        archivedAt: null,
      },
    ],
  },
];

describe('flattenAccountsForPicker', () => {
  it('returns active visible accounts only', () => {
    const result = flattenAccountsForPicker(groups);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'a1',
      name: 'HDFC Salary',
      currentBalance: 50000,
      bank: 'Banking',
    });
  });
});
