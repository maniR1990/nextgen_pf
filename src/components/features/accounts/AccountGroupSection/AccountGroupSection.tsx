'use client';

import type { AccountGroupWithAccounts, AccountSummary } from '@/modules/accounts/accounts.types';
import { ChevronDown, ChevronRight, Eye, EyeOff, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AccountListRow } from '../AccountListRow';
import { BalancePill } from '../BalancePill';

export interface AccountGroupSectionProps {
  group: AccountGroupWithAccounts;
  /** null = each group manages its own state; true/false = override from parent */
  collapseOverride?: boolean | null;
  onAccountClick?: (account: AccountSummary) => void;
  onEdit?: (account: AccountSummary) => void;
  onTransfer?: (account: AccountSummary) => void;
  onArchive?: (account: AccountSummary) => void;
  onDelete?: (account: AccountSummary) => void;
  onAddAccount?: (groupId: string) => void;
  onEditGroup?: (group: AccountGroupWithAccounts) => void;
  onDeleteGroup?: (group: AccountGroupWithAccounts) => void;
  onAccountHover?: (account: AccountSummary) => void;
  onAccountHoverEnd?: () => void;
}

export function AccountGroupSection({
  group,
  collapseOverride = null,
  onAccountClick,
  onEdit,
  onTransfer,
  onArchive,
  onDelete,
  onAddAccount,
  onEditGroup,
  onDeleteGroup,
  onAccountHover,
  onAccountHoverEnd,
}: AccountGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(group.isCollapsed);
  const [totalVisible, setTotalVisible] = useState(false);

  // Sync with parent collapse-all / expand-all override
  useEffect(() => {
    if (collapseOverride !== null) setCollapsed(collapseOverride);
  }, [collapseOverride]);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [groupMenuPos, setGroupMenuPos] = useState<{ top: number; right: number } | null>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const groupMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const groupTotal = group.accounts.reduce((sum, a) => sum + a.balance, 0);

  useEffect(() => {
    if (!groupMenuOpen) return;
    const close = () => setGroupMenuOpen(false);
    const handleOutside = (e: MouseEvent) => {
      if (!groupMenuRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('scroll', close, true);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('scroll', close, true);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [groupMenuOpen]);
  const visibleAccounts = group.accounts.filter((a) => !a.isHidden && a.status !== 'CLOSED');
  const hasGroupMenu = Boolean(onEditGroup || onDeleteGroup);

  return (
    <section className="account-group-section" aria-label={group.name}>
      <div className="account-group-section__header">
        <button
          type="button"
          className="account-group-section__toggle"
          aria-expanded={!collapsed}
          aria-label={group.name}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? (
            <ChevronRight size={16} aria-hidden />
          ) : (
            <ChevronDown size={16} aria-hidden />
          )}
          <span className="account-group-section__name">{group.name}</span>
          <span
            className="account-group-section__count"
            aria-label={`${visibleAccounts.length} accounts`}
          >
            {visibleAccounts.length}
          </span>
        </button>
        <div className="account-group-section__actions">
          {totalVisible ? (
            <BalancePill amount={groupTotal} size="sm" />
          ) : (
            <span className="account-group-section__total-hidden">••••••</span>
          )}
          <button
            type="button"
            className="account-group-section__eye"
            aria-label={totalVisible ? 'Hide group total' : 'Show group total'}
            onClick={(e) => {
              e.stopPropagation();
              setTotalVisible((v) => !v);
            }}
          >
            {totalVisible ? <EyeOff size={13} aria-hidden /> : <Eye size={13} aria-hidden />}
          </button>
          {onAddAccount && (
            <button
              type="button"
              className="account-group-section__add"
              aria-label="Add account"
              onClick={() => onAddAccount(group.id)}
            >
              <Plus size={14} aria-hidden />
            </button>
          )}
          {hasGroupMenu && (
            <div className="account-group-section__menu-wrap" ref={groupMenuRef}>
              <button
                ref={groupMenuTriggerRef}
                type="button"
                className="account-group-section__menu-trigger"
                aria-label="Group options"
                aria-expanded={groupMenuOpen}
                aria-haspopup="menu"
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!groupMenuOpen && groupMenuTriggerRef.current) {
                    const rect = groupMenuTriggerRef.current.getBoundingClientRect();
                    setGroupMenuPos({
                      top: rect.bottom + 4,
                      right: window.innerWidth - rect.right,
                    });
                  }
                  setGroupMenuOpen((v) => !v);
                }}
              >
                <MoreHorizontal size={15} aria-hidden />
              </button>
              {groupMenuOpen && groupMenuPos && (
                <div
                  role="menu"
                  className="account-group-section__menu"
                  style={{ position: 'fixed', top: groupMenuPos.top, right: groupMenuPos.right }}
                  onBlur={(e) => {
                    if (!groupMenuRef.current?.contains(e.relatedTarget as Node)) {
                      setGroupMenuOpen(false);
                    }
                  }}
                >
                  {onEditGroup && (
                    <button
                      type="button"
                      role="menuitem"
                      className="account-group-section__menu-item"
                      onClick={() => {
                        setGroupMenuOpen(false);
                        onEditGroup(group);
                      }}
                    >
                      Edit Group
                    </button>
                  )}
                  {onDeleteGroup && (
                    <button
                      type="button"
                      role="menuitem"
                      className="account-group-section__menu-item account-group-section__menu-item--danger"
                      onClick={() => {
                        setGroupMenuOpen(false);
                        onDeleteGroup(group);
                      }}
                    >
                      Delete Group
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="account-group-section__body" role="list">
          {visibleAccounts.map((account) => (
            <div key={account.id} role="listitem">
              <AccountListRow
                account={account}
                onClick={onAccountClick}
                onEdit={onEdit}
                onTransfer={onTransfer}
                onArchive={onArchive}
                onDelete={onDelete}
                onHover={onAccountHover}
                onHoverEnd={onAccountHoverEnd}
              />
            </div>
          ))}
          {visibleAccounts.length === 0 && (
            <p className="account-group-section__empty">No accounts in this group</p>
          )}
        </div>
      )}
    </section>
  );
}
