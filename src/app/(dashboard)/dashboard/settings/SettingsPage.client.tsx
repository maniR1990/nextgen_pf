'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsWorkspace, SettingsPageConfigSchema } from '@/components/common/SettingsWorkspace';
import { useSettingsCategoriesCrud } from '@/hooks/useSettingsCategoriesCrud';
import { useAccountDetail } from '@/hooks/useAccountDetail';
import { useFundsSettings } from '@/hooks/useFundsSettings';
import { useFundGroups } from '@/hooks/useFundGroups';
import { AccountsShell } from '@/components/features/accounts/AccountsShell';
import {
  apiGetV1,
  apiPostV1,
  apiPutV1,
  apiDeleteV1,
  apiPatchV1,
  getFetchErrorMessage,
} from '@/lib/query/fetcher';
import { useToast } from '@/components/common/ToastProvider/useToast';
import { queryKeys } from '@/lib/query/queryKeys';
import type { AccountGroupWithAccounts, AccountDetail, CreateAccountDto } from '@/modules/accounts/accounts.types';
import type { TransferPayload } from '@/components/features/accounts/TransferModal';
import type { AccountGroupFormPayload } from '@/components/features/accounts/AccountGroupFormModal';
import type { FundAllocationInput } from '@/modules/funds/funds.types';
import rawConfig from '@/config/settingsPage.json';

const categoriesTabOnly = SettingsPageConfigSchema.parse({
  ariaLabel: 'Category settings',
  defaultTabId: 'categories',
  tabs: (rawConfig as { tabs: { id: string }[] }).tabs.filter((t) => t.id === 'categories'),
});

function CategoriesPanel() {
  const categories = useSettingsCategoriesCrud();

  const hierarchyOverrides = useMemo(() => {
    if (categories.isLoading) return undefined;
    return { categories: categories.isError ? [] : categories.nodes };
  }, [categories.isError, categories.isLoading, categories.nodes]);

  return (
    <SettingsWorkspace
      config={categoriesTabOnly}
      hierarchyOverrides={hierarchyOverrides}
      onCreate={categories.handleCreate}
      onUpdate={categories.handleUpdate}
      onDelete={categories.handleDelete}
      canEdit={categories.canEdit}
      canDelete={categories.canDelete}
    />
  );
}

export function SettingsPageClient() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const funds = useFundsSettings();
  const fundGroups = useFundGroups();

  const {
    data: accountGroups = [],
    isLoading: accountsLoading,
    isError: accountsError,
  } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => apiGetV1<AccountGroupWithAccounts[]>('/api/v1/accounts?limit=100&sort=name_asc'),
    staleTime: 0,
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const detail = useAccountDetail(selectedAccountId);

  const invalidateAccounts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.formOptions.sources() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources.all });
  }, [queryClient]);

  // ── Account Group handlers ──────────────────────────────────────────────────

  const handleCreateGroup = useCallback(
    async (payload: AccountGroupFormPayload) => {
      try {
        await apiPostV1('/api/v1/account-groups', payload);
        toast.success('Group created', { description: payload.name });
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not create group'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  const handleUpdateGroup = useCallback(
    async (id: string, payload: { name: string }) => {
      try {
        await apiPutV1(`/api/v1/account-groups/${id}`, payload);
        toast.success('Group updated');
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not update group'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      try {
        await apiDeleteV1(`/api/v1/account-groups/${id}`);
        toast.success('Group deleted');
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not delete group'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  // ── Account handlers ────────────────────────────────────────────────────────

  const handleCreateAccount = useCallback(
    async (dto: CreateAccountDto) => {
      try {
        await apiPostV1('/api/v1/accounts', dto);
        toast.success('Account created', { description: dto.name });
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not create account'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  const handleUpdateAccount = useCallback(
    async (id: string, dto: Partial<CreateAccountDto>) => {
      await detail.update(id, dto);
    },
    [detail],
  );

  const handleDeleteAccount = useCallback(
    async (id: string) => {
      try {
        await apiDeleteV1(`/api/v1/accounts/${id}`);
        toast.success('Account deleted');
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not delete account'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  const handleTransfer = useCallback(
    async (payload: TransferPayload) => {
      try {
        await apiPatchV1(`/api/v1/accounts/${payload.fromAccountId}/transfer`, {
          toAccountId: payload.toAccountId,
          amount: payload.amount,
          note: payload.note || undefined,
          date: payload.date,
        });
        toast.success('Transfer complete');
        await invalidateAccounts();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Transfer failed'));
        throw err;
      }
    },
    [invalidateAccounts, toast],
  );

  const handleArchiveAccount = useCallback(
    async (id: string) => {
      await detail.archive(id);
      await invalidateAccounts();
    },
    [detail, invalidateAccounts],
  );

  const accountDetailLoader = useCallback(async (accountId: string): Promise<AccountDetail> => {
    setSelectedAccountId(accountId);
    return apiGetV1<AccountDetail>(`/api/v1/accounts/${accountId}`);
  }, []);

  const handleSaveAllocations = useCallback(
    async (fundId: string, allocations: FundAllocationInput[]) => {
      await funds.saveAllocations(fundId, allocations);
    },
    [funds],
  );

  if (accountsLoading) {
    return (
      <div className="accounts-shell" aria-busy="true" aria-live="polite">
        <div className="accounts-shell__loading" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="accounts-shell" aria-busy="true" aria-live="polite"><div className="accounts-shell__loading" /></div>}>
      <AccountsShell
        accountGroups={accountsError ? [] : accountGroups}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        funds={funds.funds}
        fundGroups={fundGroups.groups}
        fundsSummary={funds.summary}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        onTransfer={handleTransfer}
        onArchiveAccount={handleArchiveAccount}
        onCreateFund={funds.createFund}
        onUpdateFund={funds.updateFund}
        onArchiveFund={funds.archiveFund}
        onDeleteFund={funds.deleteFund}
        onSaveAllocations={handleSaveAllocations}
        onCreateFundGroup={fundGroups.createGroup}
        onUpdateFundGroup={fundGroups.updateGroup}
        onDeleteFundGroup={fundGroups.deleteGroup}
        onRestoreFundGroup={fundGroups.restoreGroup}
        accountDetailLoader={accountDetailLoader}
        categoriesPanel={<CategoriesPanel />}
      />
    </Suspense>
  );
}
