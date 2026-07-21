'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import { AccountFormWizard } from '@/components/features/accounts/AccountFormWizard';
import { apiGetV1, apiPostV1, getFetchErrorMessage } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type {
  AccountGroupWithAccounts,
  AccountSummary,
  CreateAccountDto,
} from '@/modules/accounts/accounts.types';
import { useAccountWizardStore } from '@/store/accountWizardStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Globally mounted (see dashboard/layout.tsx) so the "+ Add an account" nudge inside
 * CommonFormFields — surfaced to a brand-new user with zero accounts, who would
 * otherwise be stuck on a required, empty Account dropdown — can open account creation
 * without leaving the transaction dialog. Shares the same query key as the Settings ->
 * Accounts tab, so the account list stays in sync everywhere once one is created.
 */
export function AccountCreationModal() {
  const { isOpen, close } = useAccountWizardStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: accountGroups = [] } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => apiGetV1<AccountGroupWithAccounts[]>('/api/v1/accounts?limit=100&sort=name_asc'),
    staleTime: 60_000,
    enabled: isOpen,
  });

  const createAccount = useMutation({
    mutationFn: (dto: CreateAccountDto) => apiPostV1<AccountSummary>('/api/v1/accounts', dto),
    onSuccess: async (_result, dto) => {
      toast.success('Account created', { description: dto.name });
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.formOptions.sources() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.appHeader.all });
    },
    onError: (err) => {
      toast.error(getFetchErrorMessage(err, 'Could not create account'));
    },
  });

  return (
    <AccountFormWizard
      open={isOpen}
      onClose={close}
      accountGroups={accountGroups}
      onSubmit={(dto) => createAccount.mutateAsync(dto)}
    />
  );
}
