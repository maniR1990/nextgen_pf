'use client';

import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { formatINRCompact } from '@/lib/utils/format';
import type { FundSummary, SourceBreakdown } from '@/modules/funds/funds.types';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Investment / alternate account types — their full balance is dedicated capital */
const INVESTMENT_GROUPS = new Set(['investment', 'alternate']);

function isDedicatedSource(s: SourceBreakdown): boolean {
  const meta = ACCOUNT_TYPE_META[s.accountType];
  return meta ? INVESTMENT_GROUPS.has(meta.group) : false;
}

function accountLabel(type: string): string {
  return (ACCOUNT_TYPE_META as Record<string, { name: string } | undefined>)[type]?.name ?? type;
}

const PURPOSE_LABEL: Record<string, string> = {
  EMERGENCY: 'Safety',
  OPS: 'Operations',
  GOAL: 'Goal',
  TAX: 'Tax',
  INSURANCE: 'Insurance',
  SINKING: 'Sinking',
  INVESTMENT: 'Investment',
  WEALTH: 'Wealth',
};

function resolveHealth(pct: number): 'healthy' | 'ok' | 'low' {
  if (pct >= 100) return 'healthy';
  if (pct >= 50) return 'ok';
  return 'low';
}

export interface FundListRowProps {
  fund: FundSummary;
  onEdit?: (fund: FundSummary) => void;
  onAllocate?: (fund: FundSummary) => void;
  onArchive?: (fund: FundSummary) => void;
  onDelete?: (fund: FundSummary) => void;
}

export function FundListRow({ fund, onEdit, onAllocate, onArchive, onDelete }: FundListRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const health = resolveHealth(fund.percentFilled);
  const fillPct = Math.min(100, Math.max(0, fund.percentFilled));
  const isComplete = fund.percentFilled >= 100;
  const purposeLabel = PURPOSE_LABEL[fund.purpose] ?? fund.purpose;
  const hasMenu = onEdit || onAllocate || onArchive || onDelete;

  // Dedicated sources: investment/alternate accounts that are 100% allocated to this fund
  const dedicatedSources = fund.sources.filter(
    (s) => isDedicatedSource(s) && s.type === 'PERCENTAGE' && s.value >= 1,
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function handleRowClick() {
    router.push(`/dashboard/settings/funds/${fund.id}`);
  }

  return (
    <li
      className={`fund-list-row fund-list-row--${health}`}
      style={
        {
          '--fund-color': fund.color ?? undefined,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="fund-list-row__main"
        onClick={handleRowClick}
        aria-label={`View ${fund.name} — ${purposeLabel}, ${Math.round(fillPct)}% funded`}
      >
        <span className="fund-list-row__icon" aria-hidden>
          {fund.icon ?? fund.name[0]}
        </span>

        <span className="fund-list-row__info">
          <span className="fund-list-row__name">{fund.name}</span>
          <span className="fund-list-row__badge">{purposeLabel}</span>
          {dedicatedSources.length > 0 && (
            <span className="fund-list-row__dedicated">
              {dedicatedSources.slice(0, 2).map((s) => (
                <span key={s.accountId} className="fund-list-row__dedicated-chip">
                  {accountLabel(s.accountType)} · {formatINRCompact(s.accountBalance)}
                </span>
              ))}
              {dedicatedSources.length > 2 && (
                <span className="fund-list-row__dedicated-chip fund-list-row__dedicated-chip--more">
                  +{dedicatedSources.length - 2} more
                </span>
              )}
            </span>
          )}
        </span>

        <span
          className="fund-list-row__track"
          role="progressbar"
          aria-valuenow={Math.round(fillPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(fillPct)}% funded`}
        >
          <span className="fund-list-row__fill" style={{ width: `${fillPct}%` }} />
        </span>

        <span className="fund-list-row__amounts">
          <span className="fund-list-row__current">{formatINRCompact(fund.currentAmount)}</span>
          <span className="fund-list-row__target">
            {fund.targetAmount > 0
              ? `/ ${formatINRCompact(fund.targetAmount)}${isComplete ? ' ✓' : ''}`
              : '/ ∞'}
          </span>
        </span>
      </button>

      {hasMenu && (
        <div
          className="fund-list-row__menu-wrap"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="fund-list-row__menu-trigger"
            aria-label={`Options for ${fund.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={15} aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="fund-list-row__menu">
              {onEdit && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-list-row__menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(fund);
                  }}
                >
                  Edit
                </button>
              )}
              {onAllocate && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-list-row__menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onAllocate(fund);
                  }}
                >
                  Allocate
                </button>
              )}
              {onArchive && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-list-row__menu-item fund-list-row__menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(fund);
                  }}
                >
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-list-row__menu-item fund-list-row__menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(fund);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
