import type { FormSourceOption } from '@/lib/data/transaction-options';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';

/** Flatten grouped accounts into selectable payment-source options for transaction forms. */
export function flattenAccountsForPicker(groups: AccountGroupWithAccounts[]): FormSourceOption[] {
  const options: FormSourceOption[] = [];

  for (const group of groups) {
    for (const account of group.accounts) {
      if (account.status !== 'ACTIVE' || account.isHidden || account.archivedAt) continue;
      options.push({
        id: account.id,
        name: account.name,
        type: account.type,
        currentBalance: account.balance,
        bank: group.name,
      });
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
