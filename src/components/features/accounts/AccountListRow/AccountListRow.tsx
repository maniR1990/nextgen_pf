'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { AccountSummary } from '@/modules/accounts/accounts.types';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { Badge } from '@/components/ui/Badge';
import { BalancePill } from '../BalancePill';

export interface AccountListRowProps {
  account: AccountSummary;
  onClick?: (account: AccountSummary) => void;
  onEdit?: (account: AccountSummary) => void;
  onTransfer?: (account: AccountSummary) => void;
  onArchive?: (account: AccountSummary) => void;
  onDelete?: (account: AccountSummary) => void;
  onHover?: (account: AccountSummary) => void;
  onHoverEnd?: () => void;
}

const SYNC_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  CLOSED: 'Closed',
  FROZEN: 'Frozen',
};

export function AccountListRow({
  account,
  onClick,
  onEdit,
  onTransfer,
  onArchive,
  onDelete,
  onHover,
  onHoverEnd,
}: AccountListRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const meta = ACCOUNT_TYPE_META[account.type];

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const handleOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('scroll', close, true);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('scroll', close, true);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [menuOpen]);

  const hasMenu = Boolean(onEdit || onTransfer || onArchive || onDelete);

  return (
    <div
      className="account-list-row"
      data-menu-open={menuOpen || undefined}
      onMouseEnter={() => onHover?.(account)}
      onMouseLeave={() => onHoverEnd?.()}
    >
      <button
        type="button"
        className="account-list-row__main"
        aria-label={account.name}
        onClick={() => onClick?.(account)}
      >
        <span className="account-list-row__icon" aria-hidden>
          {meta.codePrefix.slice(0, 2)}
        </span>
        <span className="account-list-row__name">{account.name}</span>
        <span className="account-list-row__balance">
          <BalancePill amount={account.balance} size="sm" />
        </span>
        <span
          className={[
            'account-list-row__sync-dot',
            account.status === 'ACTIVE' ? 'account-list-row__sync-dot--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={SYNC_STATUS_LABEL[account.status] ?? account.status}
          aria-label={`Status: ${SYNC_STATUS_LABEL[account.status] ?? account.status}`}
        />
        <Badge variant="inactive" kind="label" className="account-list-row__type-badge">
          {meta.name}
        </Badge>
      </button>

      {hasMenu && (
        <div className="account-list-row__menu-wrap" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            className="account-list-row__menu-trigger"
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onPointerDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              if (!menuOpen && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
              }
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
          {menuOpen && menuPos && (
            <div
              role="menu"
              className="account-list-row__menu"
              style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
              onBlur={(e) => {
                if (!menuRef.current?.contains(e.relatedTarget as Node)) setMenuOpen(false);
              }}
            >
              {onEdit && (
                <button
                  type="button"
                  role="menuitem"
                  className="account-list-row__menu-item"
                  onClick={() => { setMenuOpen(false); onEdit(account); }}
                >
                  Edit
                </button>
              )}
              {onTransfer && (
                <button
                  type="button"
                  role="menuitem"
                  className="account-list-row__menu-item"
                  onClick={() => { setMenuOpen(false); onTransfer(account); }}
                >
                  Transfer
                </button>
              )}
              {onArchive && (
                <button
                  type="button"
                  role="menuitem"
                  className="account-list-row__menu-item account-list-row__menu-item--danger"
                  onClick={() => { setMenuOpen(false); onArchive(account); }}
                >
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  role="menuitem"
                  className="account-list-row__menu-item account-list-row__menu-item--danger"
                  onClick={() => { setMenuOpen(false); onDelete(account); }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
