'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { SETTINGS_TAB_QUERY_KEY } from '@/constants/settings';
import type {
  AccountDetail,
  AccountGroupWithAccounts,
  AccountSummary,
  TransactionPage,
} from '@/modules/accounts/accounts.types';
import type { CreateAccountDto } from '@/modules/accounts/accounts.types';
import { computeNetWorth } from '@/modules/accounts/lib/net-worth';
import type {
  CreateFundGroupDto,
  FundGroupSummary,
  UpdateFundGroupDto,
} from '@/modules/fund-groups/fund-groups.types';
import type {
  CreateFundDto,
  FundAllocationInput,
  FundSummary,
  FundsAggregateSummary,
} from '@/modules/funds/funds.types';
import { ChevronsDownUp, ChevronsUpDown, CreditCard, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AllocationEditor } from '../../funds/AllocationEditor';
import { FundBucketBoard } from '../../funds/FundBucketBoard';
import { FundFormDrawer } from '../../funds/FundFormDrawer';
import { FundGroupFormDialog } from '../../funds/FundGroupFormDialog';
import { AccountDetailDrawer } from '../AccountDetailDrawer';
import { AccountFormWizard } from '../AccountFormWizard';
import { AccountGroupFormModal, type AccountGroupFormPayload } from '../AccountGroupFormModal';
import { AccountGroupSection } from '../AccountGroupSection';
import { ArchiveConfirmModal } from '../ArchiveConfirmModal';
import { BalancePill } from '../BalancePill';
import { NetWorthBanner } from '../NetWorthBanner';
import { TransferModal } from '../TransferModal';
import type { TransferPayload } from '../TransferModal';

const DELETE_GROUP_TITLE_ID = 'delete-group-modal-title';

export interface AccountsShellProps {
  accountGroups: AccountGroupWithAccounts[];
  funds: FundSummary[];
  fundGroups: FundGroupSummary[];
  fundsSummary: FundsAggregateSummary | undefined;
  onCreateAccount: (dto: CreateAccountDto) => Promise<AccountSummary | undefined>;
  onUpdateAccount?: (id: string, dto: Partial<CreateAccountDto>) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  onTransfer?: (payload: TransferPayload) => Promise<void>;
  onArchiveAccount?: (id: string) => Promise<void>;
  onCreateGroup: (payload: AccountGroupFormPayload) => Promise<void>;
  onUpdateGroup: (id: string, payload: { name: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onCreateFund: (dto: CreateFundDto) => Promise<void>;
  onUpdateFund?: (id: string, dto: Partial<CreateFundDto>) => Promise<void>;
  onArchiveFund?: (id: string) => Promise<void>;
  onDeleteFund?: (id: string) => Promise<void>;
  onSaveAllocations?: (fundId: string, allocations: FundAllocationInput[]) => Promise<void>;
  onCreateFundGroup?: (dto: CreateFundGroupDto) => Promise<void>;
  onUpdateFundGroup?: (id: string, dto: UpdateFundGroupDto) => Promise<void>;
  onDeleteFundGroup?: (id: string) => Promise<void>;
  onRestoreFundGroup?: (id: string) => Promise<void>;
  accountDetailLoader?: (accountId: string) => Promise<AccountDetail>;
  transactionsLoader?: (accountId: string, page: number, limit: number) => Promise<TransactionPage>;
  hasMoreAccounts?: boolean;
  onLoadMoreAccounts?: () => Promise<void>;
  categoriesPanel?: React.ReactNode;
  className?: string;
}

export function AccountsShell({
  accountGroups,
  funds,
  fundGroups,
  fundsSummary,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransfer,
  onArchiveAccount,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateFund,
  onUpdateFund,
  onArchiveFund,
  onDeleteFund,
  onSaveAllocations,
  onCreateFundGroup,
  onUpdateFundGroup,
  onDeleteFundGroup,
  onRestoreFundGroup,
  accountDetailLoader,
  transactionsLoader,
  hasMoreAccounts,
  onLoadMoreAccounts,
  categoriesPanel,
  className = '',
}: AccountsShellProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get(SETTINGS_TAB_QUERY_KEY) ?? 'accounts';

  // Account modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<AccountDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [previewAccount, setPreviewAccount] = useState<AccountSummary | null>(null);
  const [transferFrom, setTransferFrom] = useState<AccountSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AccountSummary | null>(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<AccountSummary | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // null = mixed (each group uses its own default), true = all collapsed, false = all expanded
  const [collapseOverride, setCollapseOverride] = useState<boolean | null>(null);
  const allCollapsed = collapseOverride === true;

  // Group modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccountGroupWithAccounts | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<AccountGroupWithAccounts | null>(null);
  const [deletingGroupLoading, setDeletingGroupLoading] = useState(false);

  const [loadingMoreAccounts, setLoadingMoreAccounts] = useState(false);

  // Fund modals
  const [fundDrawerOpen, setFundDrawerOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<FundSummary | null>(null);
  const [fundDrawerGroupId, setFundDrawerGroupId] = useState<string | undefined>();
  const [allocationFund, setAllocationFund] = useState<FundSummary | null>(null);

  // Fund delete confirm
  const [deleteFundTarget, setDeleteFundTarget] = useState<FundSummary | null>(null);
  const [deletingFundLoading, setDeletingFundLoading] = useState(false);

  // Fund group modals
  const [fundGroupDialogOpen, setFundGroupDialogOpen] = useState(false);
  const [editingFundGroup, setEditingFundGroup] = useState<FundGroupSummary | null>(null);
  const [deletingFundGroup, setDeletingFundGroup] = useState<FundGroupSummary | null>(null);
  const [deletingFundGroupLoading, setDeletingFundGroupLoading] = useState(false);

  const allAccounts = accountGroups.flatMap((g) => g.accounts);

  // Build accountId → fund name map for transfer goal hints
  const goalByAccountId = funds.reduce<Record<string, string>>((map, fund) => {
    if (fund.archivedAt) return map;
    for (const src of fund.sources) {
      // Consider an account "dedicated" if it's allocated at 100%
      if (src.type === 'PERCENTAGE' && src.value >= 1) {
        map[src.accountId] = fund.name;
      }
    }
    return map;
  }, {});

  async function handleWizardSubmit(
    dto: CreateAccountDto,
    goalFundId?: string,
  ): Promise<AccountSummary | undefined> {
    const result = await onCreateAccount(dto);
    // If user linked a goal and the creation returned the new account, auto-allocate 100%
    if (goalFundId && onSaveAllocations && result && 'id' in result) {
      const existingFund = funds.find((f) => f.id === goalFundId);
      const existingSources = (existingFund?.sources ?? []).map((s) => ({
        accountId: s.accountId,
        type: s.type,
        value: s.value,
        priority: s.priority,
      }));
      await onSaveAllocations(goalFundId, [
        ...existingSources,
        { accountId: result.id, type: 'PERCENTAGE', value: 1, priority: 0 },
      ]);
    }
    return result;
  }

  const netWorth = computeNetWorth(
    accountGroups.flatMap((g) =>
      g.accounts.map((a) => ({
        balance: a.balance,
        isExcludeNetWorth: a.isExcludeNetWorth,
        groupType: g.type,
      })),
    ),
  );

  async function openAccountDrawer(account: AccountSummary) {
    if (!accountDetailLoader) return;
    setPreviewAccount(null);
    setDrawerLoading(true);
    try {
      const detail = await accountDetailLoader(account.id);
      setDrawerAccount(detail);
    } finally {
      setDrawerLoading(false);
    }
  }

  function openTransfer(account: AccountSummary) {
    setTransferFrom(account);
  }

  function openArchive(account: AccountSummary) {
    setArchiveTarget(account);
  }

  function openDeleteAccount(account: AccountSummary) {
    setDeleteAccountTarget(account);
  }

  async function handleLoadMoreAccounts() {
    if (!onLoadMoreAccounts) return;
    setLoadingMoreAccounts(true);
    try {
      await onLoadMoreAccounts();
    } finally {
      setLoadingMoreAccounts(false);
    }
  }

  function openEditFund(fund: FundSummary) {
    setEditingFund(fund);
    setFundDrawerGroupId(undefined);
    setFundDrawerOpen(true);
  }

  function handleCreateFund(groupId?: string) {
    setEditingFund(null);
    setFundDrawerGroupId(groupId);
    setFundDrawerOpen(true);
  }

  function handleOpenFundGroupCreate() {
    setEditingFundGroup(null);
    setFundGroupDialogOpen(true);
  }

  function handleOpenFundGroupEdit(group: FundGroupSummary) {
    setEditingFundGroup(group);
    setFundGroupDialogOpen(true);
  }

  async function handleFundGroupFormSubmit(dto: CreateFundGroupDto) {
    if (editingFundGroup) {
      await onUpdateFundGroup?.(editingFundGroup.id, dto);
    } else {
      await onCreateFundGroup?.(dto);
    }
  }

  async function handleDeleteFundGroupConfirm() {
    if (!deletingFundGroup) return;
    setDeletingFundGroupLoading(true);
    try {
      await onDeleteFundGroup?.(deletingFundGroup.id);
      setDeletingFundGroup(null);
    } finally {
      setDeletingFundGroupLoading(false);
    }
  }

  async function handleGroupSubmit(payload: AccountGroupFormPayload) {
    if (editingGroup) {
      await onUpdateGroup(editingGroup.id, { name: payload.name });
    } else {
      await onCreateGroup(payload);
    }
  }

  async function handleDeleteGroupConfirm() {
    if (!deletingGroup) return;
    setDeletingGroupLoading(true);
    try {
      await onDeleteGroup(deletingGroup.id);
      setDeletingGroup(null);
    } finally {
      setDeletingGroupLoading(false);
    }
  }

  async function handleDeleteAccountConfirm() {
    if (!deleteAccountTarget || !onDeleteAccount) return;
    setDeletingAccount(true);
    try {
      await onDeleteAccount(deleteAccountTarget.id);
      setDeleteAccountTarget(null);
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleDeleteFundConfirm() {
    if (!deleteFundTarget || !onDeleteFund) return;
    setDeletingFundLoading(true);
    try {
      await onDeleteFund(deleteFundTarget.id);
      setDeleteFundTarget(null);
    } finally {
      setDeletingFundLoading(false);
    }
  }

  return (
    <div className={['accounts-shell', className].filter(Boolean).join(' ')}>
      {/* ── Accounts Tab ── */}
      {activeTab === 'accounts' && (
        <div className="accounts-shell__panel" role="tabpanel" aria-label="Accounts">
          <NetWorthBanner
            totalAssets={netWorth.totalAssets}
            totalLiabilities={netWorth.totalLiabilities}
            netWorth={netWorth.netWorth}
          />
          {drawerLoading && (
            <div
              className="accounts-shell__mobile-loading"
              role="progressbar"
              aria-label="Loading account"
            />
          )}
          <div className="accounts-shell__split">
            {/* Left: compact account list */}
            <div className="accounts-shell__list-pane">
              <div className="accounts-shell__toolbar">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCollapseOverride((v) => v !== true)}
                  aria-label={allCollapsed ? 'Expand all groups' : 'Collapse all groups'}
                  title={allCollapsed ? 'Expand all' : 'Collapse all'}
                >
                  {allCollapsed ? (
                    <>
                      <ChevronsUpDown size={14} aria-hidden /> Expand All
                    </>
                  ) : (
                    <>
                      <ChevronsDownUp size={14} aria-hidden /> Collapse All
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupModalOpen(true);
                  }}
                >
                  <Plus size={14} aria-hidden /> Add Group
                </Button>
                <Button size="sm" onClick={() => setWizardOpen(true)}>
                  <Plus size={14} aria-hidden /> Add Account
                </Button>
              </div>
              <div className="accounts-shell__groups">
                {accountGroups.map((group) => (
                  <AccountGroupSection
                    key={group.id}
                    group={group}
                    collapseOverride={collapseOverride}
                    onAccountClick={openAccountDrawer}
                    onEdit={openAccountDrawer}
                    onTransfer={openTransfer}
                    onArchive={openArchive}
                    onDelete={onDeleteAccount ? openDeleteAccount : undefined}
                    onAddAccount={() => setWizardOpen(true)}
                    onEditGroup={(g) => {
                      setEditingGroup(g);
                      setGroupModalOpen(true);
                    }}
                    onDeleteGroup={setDeletingGroup}
                    onAccountHover={(account) => {
                      if (!drawerAccount && !drawerLoading) setPreviewAccount(account);
                    }}
                    onAccountHoverEnd={() => {
                      if (!drawerAccount && !drawerLoading) setPreviewAccount(null);
                    }}
                  />
                ))}
                {accountGroups.length === 0 && (
                  <div className="accounts-shell__empty">
                    <p>No account groups yet. Create a group first, then add accounts to it.</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingGroup(null);
                        setGroupModalOpen(true);
                      }}
                    >
                      Create your first group
                    </Button>
                  </div>
                )}
              </div>
              {hasMoreAccounts && (
                <div className="accounts-shell__load-more">
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loadingMoreAccounts}
                    onClick={handleLoadMoreAccounts}
                  >
                    Load more accounts
                  </Button>
                </div>
              )}
            </div>

            {/* Right: detail pane (desktop only — hidden on mobile via CSS) */}
            <div className="accounts-shell__detail-pane">
              {drawerLoading && (
                <div
                  className="accounts-shell__detail-loading"
                  role="status"
                  aria-label="Loading account details"
                >
                  <div className="accounts-shell__detail-skeleton" />
                  <div className="accounts-shell__detail-skeleton accounts-shell__detail-skeleton--body" />
                  <div className="accounts-shell__detail-skeleton accounts-shell__detail-skeleton--body" />
                  <div className="accounts-shell__detail-skeleton accounts-shell__detail-skeleton--body" />
                </div>
              )}
              {!drawerLoading && drawerAccount && (
                <AccountDetailDrawer
                  key={drawerAccount.id}
                  inline
                  open
                  account={drawerAccount}
                  onClose={() => setDrawerAccount(null)}
                  onUpdate={onUpdateAccount}
                  accountGroups={accountGroups}
                  accounts={allAccounts}
                  onTransfer={onTransfer}
                  transactionsLoader={transactionsLoader}
                />
              )}
              {!drawerLoading && !drawerAccount && previewAccount && (
                <div className="accounts-shell__detail-preview">
                  <div className="accounts-shell__preview-avatar" aria-hidden>
                    {ACCOUNT_TYPE_META[previewAccount.type]?.codePrefix?.slice(0, 2) ?? '??'}
                  </div>
                  <div className="accounts-shell__preview-info">
                    <span className="accounts-shell__preview-name">{previewAccount.name}</span>
                    <span className="accounts-shell__preview-type">
                      {ACCOUNT_TYPE_META[previewAccount.type]?.name ?? previewAccount.type}
                    </span>
                    <BalancePill
                      amount={previewAccount.balance}
                      currency={previewAccount.currency}
                      size="lg"
                    />
                  </div>
                  <p className="accounts-shell__preview-hint">Click to open full details</p>
                </div>
              )}
              {!drawerLoading && !drawerAccount && !previewAccount && (
                <div className="accounts-shell__detail-empty">
                  <CreditCard size={40} aria-hidden />
                  <p>Select an account to view details, edit settings, or initiate a transfer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Funds Tab ── */}
      {activeTab === 'funds' && (
        <div className="accounts-shell__panel" role="tabpanel" aria-label="Funds">
          <FundBucketBoard
            groups={fundGroups}
            funds={funds}
            summary={fundsSummary}
            onCreateFund={handleCreateFund}
            onEditFund={openEditFund}
            onAllocateFund={(fund) => setAllocationFund(fund)}
            onAllocateIdle={() => setFundDrawerOpen(true)}
            onArchiveFund={onArchiveFund ? (fund) => onArchiveFund(fund.id) : undefined}
            onDeleteFund={onDeleteFund ? (fund) => setDeleteFundTarget(fund) : undefined}
            onCreateGroup={onCreateFundGroup ? handleOpenFundGroupCreate : undefined}
            onEditGroup={onUpdateFundGroup ? handleOpenFundGroupEdit : undefined}
            onDeleteGroup={onDeleteFundGroup ? (g) => setDeletingFundGroup(g) : undefined}
            onRestoreGroup={onRestoreFundGroup ? (g) => onRestoreFundGroup(g.id) : undefined}
          />
        </div>
      )}

      {/* ── Categories Tab ── */}
      {activeTab === 'categories' && (
        <div className="accounts-shell__panel" role="tabpanel" aria-label="Categories">
          {categoriesPanel ?? <p className="accounts-shell__empty">Categories editor</p>}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Create / Edit group */}
      <AccountGroupFormModal
        open={groupModalOpen}
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleGroupSubmit}
        initialValues={
          editingGroup
            ? {
                name: editingGroup.name,
                type: editingGroup.type.toLowerCase() as 'asset' | 'liability',
              }
            : undefined
        }
      />

      {/* Delete group confirm */}
      <Modal
        open={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
        titleId={DELETE_GROUP_TITLE_ID}
      >
        <Modal.Header title={`Delete "${deletingGroup?.name}"?`}>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <p className="accounts-shell__confirm-text">
            {(deletingGroup?.accounts.length ?? 0) > 0
              ? `This group has ${deletingGroup?.accounts.length} account(s). Move or delete those accounts first before deleting the group.`
              : 'This will permanently delete the group. This action cannot be undone.'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeletingGroup(null)}
            disabled={deletingGroupLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deletingGroupLoading}
            disabled={(deletingGroup?.accounts.length ?? 0) > 0}
            onClick={handleDeleteGroupConfirm}
          >
            Delete Group
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete account confirm */}
      <Modal
        open={Boolean(deleteAccountTarget)}
        onClose={() => setDeleteAccountTarget(null)}
        titleId="delete-account-modal-title"
      >
        <Modal.Header title={`Delete "${deleteAccountTarget?.name}"?`}>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <p className="accounts-shell__confirm-text">
            This will permanently delete the account and all its data. Consider archiving instead to
            preserve history.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteAccountTarget(null)}
            disabled={deletingAccount}
          >
            Cancel
          </Button>
          <Button variant="danger" loading={deletingAccount} onClick={handleDeleteAccountConfirm}>
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete fund confirm */}
      <Modal
        open={Boolean(deleteFundTarget)}
        onClose={() => setDeleteFundTarget(null)}
        titleId="delete-fund-modal-title"
      >
        <Modal.Header title={`Delete "${deleteFundTarget?.name}"?`}>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <p className="accounts-shell__confirm-text">
            This will permanently delete the fund. Consider archiving instead to preserve history.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteFundTarget(null)}
            disabled={deletingFundLoading}
          >
            Cancel
          </Button>
          <Button variant="danger" loading={deletingFundLoading} onClick={handleDeleteFundConfirm}>
            Delete Fund
          </Button>
        </Modal.Footer>
      </Modal>

      <AccountFormWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        accountGroups={accountGroups}
        funds={funds}
        onSubmit={handleWizardSubmit}
      />

      <AccountDetailDrawer
        open={Boolean(drawerAccount)}
        account={drawerAccount}
        onClose={() => setDrawerAccount(null)}
        onUpdate={onUpdateAccount}
        accountGroups={accountGroups}
        accounts={allAccounts}
        onTransfer={onTransfer}
        transactionsLoader={transactionsLoader}
      />

      {transferFrom && onTransfer && (
        <TransferModal
          open={Boolean(transferFrom)}
          onClose={() => setTransferFrom(null)}
          accounts={allAccounts}
          fromAccountId={transferFrom.id}
          goalByAccountId={goalByAccountId}
          onSubmit={onTransfer}
        />
      )}

      {archiveTarget && onArchiveAccount && (
        <ArchiveConfirmModal
          open={Boolean(archiveTarget)}
          onClose={() => setArchiveTarget(null)}
          accountName={archiveTarget.name}
          onConfirm={async () => {
            await onArchiveAccount(archiveTarget.id);
            setArchiveTarget(null);
          }}
        />
      )}

      <FundFormDrawer
        open={fundDrawerOpen}
        onClose={() => {
          setFundDrawerOpen(false);
          setEditingFund(null);
          setFundDrawerGroupId(undefined);
        }}
        initial={editingFund ?? undefined}
        initialGroupId={fundDrawerGroupId}
        groups={fundGroups}
        onSubmit={async (dto) => {
          if (editingFund && onUpdateFund) {
            await onUpdateFund(editingFund.id, dto);
          } else {
            await onCreateFund(dto);
          }
        }}
        onCreateGroup={onCreateFundGroup ? handleOpenFundGroupCreate : undefined}
      />

      <FundGroupFormDialog
        open={fundGroupDialogOpen}
        onClose={() => {
          setFundGroupDialogOpen(false);
          setEditingFundGroup(null);
        }}
        initial={editingFundGroup ?? undefined}
        onSubmit={handleFundGroupFormSubmit}
      />

      <Modal open={Boolean(deletingFundGroup)} onClose={() => setDeletingFundGroup(null)}>
        <Modal.Header title={`Delete "${deletingFundGroup?.name}"?`} />
        <Modal.Body>
          <p className="accounts-shell__confirm-text">
            This will permanently remove the group. Funds inside it will become ungrouped.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeletingFundGroup(null)}
            disabled={deletingFundGroupLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deletingFundGroupLoading}
            onClick={handleDeleteFundGroupConfirm}
          >
            Delete Group
          </Button>
        </Modal.Footer>
      </Modal>

      {allocationFund && onSaveAllocations && (
        <AllocationEditor
          key={allocationFund.id}
          open={Boolean(allocationFund)}
          onClose={() => setAllocationFund(null)}
          fundName={allocationFund.name}
          accountGroups={accountGroups}
          initialAllocations={allocationFund.sources}
          onSave={(allocations) => onSaveAllocations(allocationFund.id, allocations)}
          otherFundsSources={funds
            .filter((f) => f.id !== allocationFund.id && !f.archivedAt)
            .flatMap((f) =>
              f.sources.map((s) => ({ accountId: s.accountId, type: s.type, value: s.value })),
            )}
        />
      )}
    </div>
  );
}
