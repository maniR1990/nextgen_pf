'use client';

import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { getTxSignedAmount } from '@/lib/balance-engine/core';
import type {
  AccountDetail,
  AccountGroupWithAccounts,
  AccountSummary,
  CreateAccountDto,
  TransactionPage,
} from '@/modules/accounts/accounts.types';
import { ArrowLeftRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BalancePill } from '../BalancePill';
import { TransferModal, type TransferPayload } from '../TransferModal';

const DRAWER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Details' },
  { id: 'fund-links', label: 'Fund Links' },
  { id: 'documents', label: 'Documents' },
];

function formatDate(d: Date | null) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(d));
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export interface AccountDetailDrawerProps {
  open: boolean;
  account: AccountDetail | null;
  onClose: () => void;
  onUpdate?: (id: string, dto: Partial<CreateAccountDto>) => Promise<void>;
  accountGroups?: AccountGroupWithAccounts[];
  accounts?: AccountSummary[];
  onTransfer?: (payload: TransferPayload) => Promise<void>;
  inline?: boolean;
  transactionsLoader?: (accountId: string, page: number, limit: number) => Promise<TransactionPage>;
}

const TX_LIMIT = 10;

export function AccountDetailDrawer({
  open,
  account,
  onClose,
  onUpdate,
  accountGroups = [],
  accounts = [],
  onTransfer,
  inline = false,
  transactionsLoader,
}: AccountDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editOpeningBalance, setEditOpeningBalance] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  const [editOpenedOn, setEditOpenedOn] = useState('');
  const [editBalanceAsOf, setEditBalanceAsOf] = useState('');
  const [saving, setSaving] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);

  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState<TransactionPage | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset fields only when account identity changes; setters are stable
  useEffect(() => {
    setTxPage(1);
    setTxData(null);
    setEditName('');
    setEditNote('');
    setEditGroupId('');
    setEditBalance('');
    setEditOpeningBalance('');
    setEditAccountNumber('');
    setEditIfscCode('');
    setEditOpenedOn('');
    setEditBalanceAsOf('');
  }, [account?.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: transactionsLoader omitted intentionally; account?.id used as stable key instead of full object
  useEffect(() => {
    if (activeTab !== 'transactions' || !transactionsLoader || !account) return;
    let cancelled = false;
    setTxLoading(true);
    transactionsLoader(account.id, txPage, TX_LIMIT)
      .then((result) => {
        if (!cancelled) setTxData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, txPage, account?.id]);

  if (!open || !account) return null;

  const acc = account; // capture narrowed type for use in closures
  const meta = ACCOUNT_TYPE_META[acc.type];

  async function handleSaveSettings() {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(acc.id, {
        name: editName || acc.name,
        note: editNote || acc.note || undefined,
        ...(editGroupId && editGroupId !== acc.groupId && { groupId: editGroupId }),
        ...(editBalance !== '' && { balance: Number.parseFloat(editBalance) }),
        ...(editOpeningBalance !== '' && { openingBalance: Number.parseFloat(editOpeningBalance) }),
        ...(editAccountNumber !== '' && { accountNumber: editAccountNumber }),
        ...(editIfscCode !== '' && { ifscCode: editIfscCode }),
        ...(editOpenedOn !== '' && { openedOn: editOpenedOn }),
        ...(editBalanceAsOf !== '' && { balanceAsOf: editBalanceAsOf }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {!inline && <div className="account-detail-drawer__backdrop" aria-hidden onClick={onClose} />}
      <aside
        className={['account-detail-drawer', inline ? 'account-detail-drawer--inline' : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={`${account.name} details`}
      >
        {/* Drawer header */}
        <div className="account-detail-drawer__header">
          <div className="account-detail-drawer__avatar" aria-hidden>
            {account.icon ?? meta.codePrefix.slice(0, 2)}
          </div>
          <div className="account-detail-drawer__header-info">
            <h2 className="account-detail-drawer__name">{account.name}</h2>
            <span className="account-detail-drawer__type">{meta.name}</span>
            <BalancePill
              amount={account.balance}
              size="lg"
              className="account-detail-drawer__balance"
            />
          </div>
          {onTransfer && accounts.length > 1 && (
            <button
              type="button"
              className="account-detail-drawer__transfer-btn"
              aria-label="Transfer money"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight size={16} aria-hidden />
              <span>Transfer</span>
            </button>
          )}
          <button
            type="button"
            className="account-detail-drawer__close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          items={DRAWER_TABS}
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
          aria-label="Account detail sections"
          className="account-detail-drawer__tabs"
        />

        {/* Tab panels */}
        <div className="account-detail-drawer__body" role="tabpanel" aria-label={activeTab}>
          {activeTab === 'overview' && (
            <div className="account-detail-drawer__overview">
              <div className="account-detail-drawer__kpi-stats">
                <div className="account-detail-drawer__kpi">
                  <span className="account-detail-drawer__kpi-label">Opening Balance</span>
                  <span className="account-detail-drawer__kpi-value">
                    ₹{formatINR(account.openingBalance)}
                  </span>
                </div>

                {/* Net Gain / Loss — always useful when openingBalance is non-zero */}
                {account.openingBalance > 0 &&
                  (() => {
                    const gain = account.balance - account.openingBalance;
                    const pct = ((gain / account.openingBalance) * 100).toFixed(1);
                    const positive = gain >= 0;
                    return (
                      <div className="account-detail-drawer__kpi">
                        <span className="account-detail-drawer__kpi-label">Net Gain / Loss</span>
                        <span
                          className={[
                            'account-detail-drawer__kpi-value',
                            positive
                              ? 'account-detail-drawer__kpi-value--positive'
                              : 'account-detail-drawer__kpi-value--negative',
                          ].join(' ')}
                        >
                          {positive ? '+' : '−'}₹{formatINR(Math.abs(gain))}
                          <span className="account-detail-drawer__kpi-badge">
                            {positive ? '+' : ''}
                            {pct}%
                          </span>
                        </span>
                      </div>
                    );
                  })()}

                {/* Invested amount if explicitly tracked */}
                {account.investedAmount != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Invested Amount</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.investedAmount)}
                    </span>
                  </div>
                )}

                {/* XIRR — annualised return */}
                {account.xirr != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">XIRR</span>
                    <span
                      className={[
                        'account-detail-drawer__kpi-value',
                        account.xirr >= 0
                          ? 'account-detail-drawer__kpi-value--positive'
                          : 'account-detail-drawer__kpi-value--negative',
                      ].join(' ')}
                    >
                      {account.xirr >= 0 ? '+' : ''}
                      {account.xirr.toFixed(2)}%
                    </span>
                  </div>
                )}

                {/* Absolute return if separately tracked */}
                {account.absoluteReturn != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Absolute Return</span>
                    <span
                      className={[
                        'account-detail-drawer__kpi-value',
                        account.absoluteReturn >= 0
                          ? 'account-detail-drawer__kpi-value--positive'
                          : 'account-detail-drawer__kpi-value--negative',
                      ].join(' ')}
                    >
                      {account.absoluteReturn >= 0 ? '+' : ''}
                      {account.absoluteReturn.toFixed(2)}%
                    </span>
                  </div>
                )}

                {/* Expected return target */}
                {account.expectedReturn != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Expected Return</span>
                    <span className="account-detail-drawer__kpi-value">
                      {account.expectedReturn}% p.a.
                    </span>
                  </div>
                )}

                {/* Credit card fields */}
                {account.creditLimit != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Credit Limit</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.creditLimit)}
                    </span>
                  </div>
                )}
                {account.creditLimit != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Available Credit</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(Math.max(0, account.creditLimit - account.balance))}
                    </span>
                  </div>
                )}
                {account.minimumPayment != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Min. Payment</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.minimumPayment)}
                    </span>
                  </div>
                )}

                {/* Loan fields */}
                {account.emi != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">EMI</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.emi)} / mo
                    </span>
                  </div>
                )}
                {account.remainingEmis != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Remaining EMIs</span>
                    <span className="account-detail-drawer__kpi-value">
                      {account.remainingEmis}
                    </span>
                  </div>
                )}
                {account.interestPaidTotal != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Interest Paid</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.interestPaidTotal)}
                    </span>
                  </div>
                )}
                {account.interestRate != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Interest Rate</span>
                    <span className="account-detail-drawer__kpi-value">
                      {account.interestRate}%
                    </span>
                  </div>
                )}
                {account.maturityDate != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Maturity Date</span>
                    <span className="account-detail-drawer__kpi-value">
                      {formatDate(account.maturityDate)}
                    </span>
                  </div>
                )}
                {account.category80C && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Tax Benefit</span>
                    <span className="account-detail-drawer__kpi-value account-detail-drawer__kpi-value--positive">
                      Sec 80C eligible
                    </span>
                  </div>
                )}

                {/* Balance freshness */}
                {account.balanceAsOf != null && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Balance as of</span>
                    <span className="account-detail-drawer__kpi-value">
                      {formatDate(account.balanceAsOf)}
                    </span>
                  </div>
                )}

                <div className="account-detail-drawer__kpi">
                  <span className="account-detail-drawer__kpi-label">Status</span>
                  <span className="account-detail-drawer__kpi-value">{account.status}</span>
                </div>

                {/* Linked accounts */}
                {account.linkedAccounts.length > 0 && (
                  <div className="account-detail-drawer__kpi account-detail-drawer__kpi--full">
                    <span className="account-detail-drawer__kpi-label">Linked Accounts</span>
                    <span className="account-detail-drawer__kpi-value">
                      {account.linkedAccounts.map((a) => a.name).join(', ')}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {account.tags.length > 0 && (
                  <div className="account-detail-drawer__kpi account-detail-drawer__kpi--full">
                    <span className="account-detail-drawer__kpi-label">Tags</span>
                    <div className="account-detail-drawer__tags">
                      {account.tags.map((t) => (
                        <span key={t} className="account-detail-drawer__tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                {account.note && (
                  <div className="account-detail-drawer__kpi account-detail-drawer__kpi--full">
                    <span className="account-detail-drawer__kpi-label">Note</span>
                    <span className="account-detail-drawer__kpi-value account-detail-drawer__kpi-value--note">
                      {account.note}
                    </span>
                  </div>
                )}
              </div>
              {account.recentActivity.length > 0 && (
                <div className="account-detail-drawer__activity">
                  <h3 className="account-detail-drawer__section-title">Recent Activity</h3>
                  <ul className="account-detail-drawer__activity-list">
                    {account.recentActivity.map((item) => {
                      const isTransferIn =
                        item.type === 'TRANSFER' && item.toAccount?.id === account.id;
                      const label =
                        item.type === 'TRANSFER'
                          ? isTransferIn
                            ? `From ${item.account?.name ?? '—'}`
                            : `To ${item.toAccount?.name ?? '—'}`
                          : (item.merchant ?? item.category?.name ?? 'Unknown');
                      const signed = getTxSignedAmount(
                        {
                          type: item.type,
                          amount: item.amount,
                          accountId: item.accountId ?? '',
                          toAccountId: item.toAccount?.id ?? null,
                        },
                        account.id,
                      );
                      return (
                        <li key={item.id} className="account-detail-drawer__activity-item">
                          <div className="account-detail-drawer__activity-info">
                            <span className="account-detail-drawer__activity-merchant">
                              {label}
                            </span>
                            {item.notes && (
                              <span className="account-detail-drawer__activity-notes">
                                {item.notes}
                              </span>
                            )}
                          </div>
                          <span
                            className={[
                              'account-detail-drawer__activity-amount',
                              signed >= 0
                                ? 'account-detail-drawer__activity-amount--credit'
                                : 'account-detail-drawer__activity-amount--debit',
                            ].join(' ')}
                          >
                            {signed >= 0 ? '+' : '−'}₹{formatINR(Math.abs(signed))}
                          </span>
                          <div className="account-detail-drawer__activity-meta">
                            <span className="account-detail-drawer__activity-date">
                              {formatDate(item.date)}
                            </span>
                            {item.status && item.status !== 'CLEARED' && (
                              <span className="account-detail-drawer__activity-status">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="account-detail-drawer__settings">
              <div className="account-detail-drawer__fields-card">
                <div className="account-detail-drawer__field">
                  <label className="account-detail-drawer__field-label" htmlFor="drawer-name">
                    Account Name
                  </label>
                  <input
                    id="drawer-name"
                    type="text"
                    className="select-field__control"
                    defaultValue={account.name}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={120}
                  />
                </div>
                {accountGroups.length > 0 && (
                  <div className="account-detail-drawer__field">
                    <label className="account-detail-drawer__field-label" htmlFor="drawer-group">
                      Account Group
                    </label>
                    <select
                      id="drawer-group"
                      className="select-field__control"
                      defaultValue={account.groupId}
                      onChange={(e) => setEditGroupId(e.target.value)}
                    >
                      {accountGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="account-detail-drawer__field">
                  <label className="account-detail-drawer__field-label" htmlFor="drawer-balance">
                    Current Balance
                  </label>
                  <input
                    id="drawer-balance"
                    type="number"
                    className="select-field__control"
                    defaultValue={account.balance}
                    onChange={(e) => setEditBalance(e.target.value)}
                  />
                </div>
                <div className="account-detail-drawer__field">
                  <label
                    className="account-detail-drawer__field-label"
                    htmlFor="drawer-balance-as-of"
                  >
                    Balance as of
                  </label>
                  <input
                    id="drawer-balance-as-of"
                    type="date"
                    className="select-field__control"
                    defaultValue={
                      account.balanceAsOf
                        ? new Date(account.balanceAsOf).toISOString().slice(0, 10)
                        : ''
                    }
                    onChange={(e) => setEditBalanceAsOf(e.target.value)}
                  />
                </div>
                <div className="account-detail-drawer__field">
                  <label
                    className="account-detail-drawer__field-label"
                    htmlFor="drawer-opening-balance"
                  >
                    Opening Balance
                  </label>
                  <input
                    id="drawer-opening-balance"
                    type="number"
                    className="select-field__control"
                    defaultValue={account.openingBalance}
                    onChange={(e) => setEditOpeningBalance(e.target.value)}
                  />
                </div>
                <div className="account-detail-drawer__field">
                  <label
                    className="account-detail-drawer__field-label"
                    htmlFor="drawer-account-number"
                  >
                    Account Number
                  </label>
                  <input
                    id="drawer-account-number"
                    type="text"
                    className="select-field__control"
                    defaultValue={account.accountNumber ?? ''}
                    placeholder="Last 4 digits or full number"
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="account-detail-drawer__field">
                  <label className="account-detail-drawer__field-label" htmlFor="drawer-ifsc">
                    IFSC Code
                  </label>
                  <input
                    id="drawer-ifsc"
                    type="text"
                    className="select-field__control"
                    defaultValue={account.ifscCode ?? ''}
                    placeholder="e.g. HDFC0001234"
                    onChange={(e) => setEditIfscCode(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="account-detail-drawer__field">
                  <label className="account-detail-drawer__field-label" htmlFor="drawer-opened-on">
                    Opened On
                  </label>
                  <input
                    id="drawer-opened-on"
                    type="date"
                    className="select-field__control"
                    defaultValue={
                      account.openedOn ? new Date(account.openedOn).toISOString().slice(0, 10) : ''
                    }
                    onChange={(e) => setEditOpenedOn(e.target.value)}
                  />
                </div>
                <div className="account-detail-drawer__field account-detail-drawer__field--textarea">
                  <label className="account-detail-drawer__field-label" htmlFor="drawer-note">
                    Note
                  </label>
                  <textarea
                    id="drawer-note"
                    className="select-field__control"
                    defaultValue={account.note ?? ''}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              {onUpdate && (
                <Button
                  loading={saving}
                  onClick={handleSaveSettings}
                  className="account-detail-drawer__save-btn"
                >
                  Save Changes
                </Button>
              )}
            </div>
          )}

          {activeTab === 'fund-links' && (
            <div className="account-detail-drawer__fund-links">
              {account.fundAllocations.length === 0 ? (
                <div className="account-detail-drawer__empty">
                  <p>This account is not linked to any fund yet.</p>
                  <p className="account-detail-drawer__empty-hint">
                    Go to <strong>Settings → Funds</strong>, open a fund, and click{' '}
                    <strong>Allocate</strong> to assign a portion of this account&apos;s balance to
                    that fund.
                  </p>
                </div>
              ) : (
                <ul className="account-detail-drawer__fund-list">
                  {account.fundAllocations.map((alloc) => (
                    <li key={alloc.fundId} className="account-detail-drawer__fund-item">
                      <span className="account-detail-drawer__fund-id">{alloc.fundId}</span>
                      <span className="account-detail-drawer__fund-value">
                        {alloc.type === 'PERCENTAGE'
                          ? `${alloc.value}%`
                          : `₹${formatINR(alloc.value)}`}
                      </span>
                      <span className="account-detail-drawer__fund-amount">
                        ≈ ₹{formatINR(alloc.computedAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="account-detail-drawer__transactions">
              {!transactionsLoader && (
                <p className="account-detail-drawer__empty">No transaction loader configured.</p>
              )}
              {transactionsLoader && txLoading && !txData && (
                <div
                  role="status"
                  className="account-detail-drawer__tx-skeleton"
                  aria-label="Loading transactions"
                />
              )}
              {transactionsLoader && txData && txData.items.length === 0 && !txLoading && (
                <p className="account-detail-drawer__empty">No transactions found.</p>
              )}
              {transactionsLoader && txData && txData.items.length > 0 && (
                <>
                  <ul className="account-detail-drawer__tx-list">
                    {txData.items.map((tx) => {
                      const isTransferIn =
                        tx.type === 'TRANSFER' && tx.toAccount?.id === account.id;
                      const label =
                        tx.type === 'TRANSFER'
                          ? isTransferIn
                            ? `From ${tx.account?.name ?? '—'}`
                            : `To ${tx.toAccount?.name ?? '—'}`
                          : (tx.merchant ?? tx.category?.name ?? 'Unknown');
                      const signed = getTxSignedAmount(
                        {
                          type: tx.type,
                          amount: tx.amount,
                          accountId: tx.accountId ?? '',
                          toAccountId: tx.toAccount?.id ?? null,
                        },
                        account.id,
                      );
                      return (
                        <li key={tx.id} className="account-detail-drawer__tx-item">
                          <div className="account-detail-drawer__tx-info">
                            <span className="account-detail-drawer__tx-merchant">{label}</span>
                            <div className="account-detail-drawer__tx-sub">
                              <span className="account-detail-drawer__tx-date">
                                {formatDate(tx.date)}
                              </span>
                              {tx.notes && (
                                <span className="account-detail-drawer__tx-notes">{tx.notes}</span>
                              )}
                              {tx.status && tx.status !== 'CLEARED' && (
                                <span className="account-detail-drawer__activity-status">
                                  {tx.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={[
                              'account-detail-drawer__tx-amount',
                              signed >= 0
                                ? 'account-detail-drawer__tx-amount--credit'
                                : 'account-detail-drawer__tx-amount--debit',
                            ].join(' ')}
                          >
                            {signed >= 0 ? '+' : '−'}₹{formatINR(Math.abs(signed))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {txData.total > TX_LIMIT && (
                    <div className="account-detail-drawer__tx-pagination">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={txPage <= 1 || txLoading}
                        onClick={() => setTxPage((p) => p - 1)}
                      >
                        <ChevronLeft size={14} aria-hidden /> Prev
                      </Button>
                      <span className="account-detail-drawer__tx-page-info">
                        {txPage} / {Math.max(1, Math.ceil(txData.total / TX_LIMIT))}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={txPage >= Math.ceil(txData.total / TX_LIMIT) || txLoading}
                        onClick={() => setTxPage((p) => p + 1)}
                      >
                        Next <ChevronRight size={14} aria-hidden />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="account-detail-drawer__documents">
              <p className="account-detail-drawer__empty">No documents attached.</p>
            </div>
          )}
        </div>
      </aside>

      {onTransfer && transferOpen && (
        <TransferModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          accounts={accounts}
          fromAccountId={acc.id}
          onSubmit={async (payload) => {
            await onTransfer(payload);
            setTransferOpen(false);
          }}
        />
      )}
    </>
  );
}
