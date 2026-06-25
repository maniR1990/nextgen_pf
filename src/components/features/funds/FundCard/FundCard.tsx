'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import type { FundSummary } from '@/modules/funds/funds.types';

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

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function resolveHealth(pct: number): 'healthy' | 'ok' | 'low' {
  if (pct >= 100) return 'healthy';
  if (pct >= 50) return 'ok';
  return 'low';
}

export interface FundCardProps {
  fund: FundSummary;
  onEdit?: (fund: FundSummary) => void;
  onAllocate?: (fund: FundSummary) => void;
  onArchive?: (fund: FundSummary) => void;
  onDelete?: (fund: FundSummary) => void;
}

export function FundCard({ fund, onEdit, onAllocate, onArchive, onDelete }: FundCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const health = resolveHealth(fund.percentFilled);
  const fillPct = Math.min(100, Math.max(0, fund.percentFilled));
  const isComplete = fund.percentFilled >= 100;
  const shownSources = fund.sources.slice(0, 2);
  const hiddenCount = fund.sources.length - shownSources.length;

  const purposeLabel = PURPOSE_LABEL[fund.purpose] ?? fund.purpose;
  const groupDesc = fund.groupDescription ?? fund.groupName;
  const subtitle = groupDesc ? `${purposeLabel} · ${groupDesc}` : purposeLabel;

  function handleCardClick() {
    router.push(`/dashboard/settings/funds/${fund.id}`);
  }

  return (
    <div
      className={`fund-card fund-card--${health}`}
      style={fund.color ? ({ '--fund-color': fund.color } as React.CSSProperties) : undefined}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      aria-label={`View ${fund.name} details`}
    >
      <div className="fund-card__header">
        {fund.icon && <span className="fund-card__icon" aria-hidden>{fund.icon}</span>}
        <span className="fund-card__name">{fund.name}</span>
        <div className="fund-card__menu-wrap" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="fund-card__menu-trigger"
            aria-label="More actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={15} aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="fund-card__menu">
              {onEdit && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-card__menu-item"
                  onClick={() => { setMenuOpen(false); onEdit(fund); }}
                >
                  Edit
                </button>
              )}
              {onAllocate && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-card__menu-item"
                  onClick={() => { setMenuOpen(false); onAllocate(fund); }}
                >
                  Allocate
                </button>
              )}
              {onArchive && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-card__menu-item fund-card__menu-item--danger"
                  onClick={() => { setMenuOpen(false); onArchive(fund); }}
                >
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  role="menuitem"
                  className="fund-card__menu-item fund-card__menu-item--danger"
                  onClick={() => { setMenuOpen(false); onDelete(fund); }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fund-card__subtitle">{subtitle}</div>

      <div className="fund-card__progress">
        <div className="fund-card__progress-fill" style={{ width: `${fillPct}%` }} />
      </div>

      <div className="fund-card__amounts">
        <span className="fund-card__current-amount">₹{formatINR(fund.currentAmount)}</span>
        <span className="fund-card__target-amount">
          {fund.targetAmount > 0 ? `₹${formatINR(fund.targetAmount)}${isComplete ? ' ✓' : ''}` : 'No cap ∞'}
        </span>
      </div>

      {shownSources.length > 0 && (
        <div className="fund-card__sources">
          {shownSources.map((src) => (
            <div key={src.accountId} className="fund-card__source-row">
              <span className="fund-card__source-name">
                {src.accountName} · {src.type === 'PERCENTAGE' ? `${src.value}%` : `₹${formatINR(src.value)}`}
              </span>
              <span className="fund-card__source-amount">₹{formatINR(src.allocatedAmount)}</span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <span className="fund-card__more">+ {hiddenCount} more accounts →</span>
          )}
        </div>
      )}
    </div>
  );
}
