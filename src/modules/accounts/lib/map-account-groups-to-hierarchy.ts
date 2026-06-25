import type { CategoryHierarchyNodeJson } from '@/components/common/CategoryHierarchy/schemas';
import { fromAccountGroupType } from '@/constants/account-groups';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';

export function mapAccountGroupsToHierarchy(
  groups: AccountGroupWithAccounts[],
): CategoryHierarchyNodeJson[] {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    level: 0,
    type: fromAccountGroupType(group.type),
    icon: group.icon ?? undefined,
    color: group.color ?? undefined,
    children: group.accounts
      .filter((a) => a.status === 'ACTIVE' && !a.isHidden)
      .map((account) => ({
        id: account.id,
        name: account.name,
        level: 1 as const,
      })),
  }));
}
