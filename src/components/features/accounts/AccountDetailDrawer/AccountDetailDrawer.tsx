'use client';

import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import type {
  AccountDetail,
  AccountGroupWithAccounts,
  CreateAccountDto,
  TransactionPage,
} from '@/modules/accounts/accounts.types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BalancePill } from '../BalancePill';

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
  const [saving, setSaving] = useState(false);

  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState<TransactionPage | null>(null);
  const [txLoading, setTxLoading] = useState(false);

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
  }, [account?.id]);

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
    // transactionsLoader intentionally omitted — caller must stabilize the reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        role="complementary"
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
                <div className="account-detail-drawer__kpi">
                  <span className="account-detail-drawer__kpi-label">Status</span>
                  <span className="account-detail-drawer__kpi-value">{account.status}</span>
                </div>
                {account.creditLimit && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Credit Limit</span>
                    <span className="account-detail-drawer__kpi-value">
                      ₹{formatINR(account.creditLimit)}
                    </span>
                  </div>
                )}
                {account.interestRate && (
                  <div className="account-detail-drawer__kpi">
                    <span className="account-detail-drawer__kpi-label">Interest Rate</span>
                    <span className="account-detail-drawer__kpi-value">
                      {account.interestRate}%
                    </span>
                  </div>
                )}
              </div>
              {account.recentActivity.length > 0 && (
                <div className="account-detail-drawer__activity">
                  <h3 className="account-detail-drawer__section-title">Recent Activity</h3>
                  <ul className="account-detail-drawer__activity-list">
                    {account.recentActivity.map((item) => (
                      <li key={item.id} className="account-detail-drawer__activity-item">
                        <span className="account-detail-drawer__activity-merchant">
                          {item.merchant ?? 'Unknown'}
                        </span>
                        <span className="account-detail-drawer__activity-amount">
                          ₹{formatINR(Math.abs(item.amount))}
                        </span>
                        <span className="account-detail-drawer__activity-date">
                          {formatDate(item.date)}
                        </span>
                      </li>
                    ))}
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
                  <span className="account-detail-drawer__field-label">Opened On</span>
                  <span className="account-detail-drawer__field-value">
                    {formatDate(account.openedOn)}
                  </span>
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
                    {txData.items.map((tx) => (
                      <li key={tx.id} className="account-detail-drawer__tx-item">
                        <div className="account-detail-drawer__tx-info">
                          <span className="account-detail-drawer__tx-merchant">
                            {tx.merchant ?? 'Unknown'}
                          </span>
                          <span className="account-detail-drawer__tx-date">
                            {formatDate(tx.date)}
                          </span>
                        </div>
                        <span
                          className={[
                            'account-detail-drawer__tx-amount',
                            tx.amount >= 0
                              ? 'account-detail-drawer__tx-amount--credit'
                              : 'account-detail-drawer__tx-amount--debit',
                          ].join(' ')}
                        >
                          {tx.amount >= 0 ? '+' : ''}₹{formatINR(Math.abs(tx.amount))}
                        </span>
                      </li>
                    ))}
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
    </>
  );
}
