'use client';

import { formatINRCompact } from '@/lib/utils/format';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import { ChevronDown, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface FundGroupCardProps {
  group: FundGroupSummary;
  fundCount: number;
  onAddFund?: (groupId: string) => void;
  onEdit?: (group: FundGroupSummary) => void;
  onDelete?: (group: FundGroupSummary) => void;
  onRestore?: (group: FundGroupSummary) => void;
  /** Renders as a full-width section header bar instead of a standalone card */
  asSection?: boolean;
  /** Controlled expand/collapse state (only used when asSection=true) */
  isExpanded?: boolean;
  /** Called when the toggle chevron is clicked */
  onToggle?: () => void;
  /** Sum of currentAmount for all funds in this group — shown in header meta */
  totalAmount?: number;
}

export function FundGroupCard({
  group,
  fundCount,
  onAddFund,
  onEdit,
  onDelete,
  onRestore,
  asSection = false,
  isExpanded = true,
  onToggle,
  totalAmount,
}: FundGroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canDelete = !group.isSystem && fundCount === 0;
  const isArchived = !!group.archivedAt;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const rootClass = [
    'fund-group-card',
    asSection && 'fund-group-card--section',
    asSection && !isExpanded && 'fund-group-card--collapsed',
    isArchived && 'fund-group-card--archived',
  ]
    .filter(Boolean)
    .join(' ');

  const kebabMenu = !isArchived && (onEdit || onDelete) && (
    <div className="fund-group-card__menu-wrap" ref={menuRef}>
      <button
        type="button"
        className="fund-group-card__menu-trigger"
        aria-label={`Options for ${group.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <MoreHorizontal size={15} aria-hidden />
      </button>
      {menuOpen && (
        <div className="fund-group-card__menu" role="menu">
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              className="fund-group-card__menu-item"
              onClick={() => {
                setMenuOpen(false);
                onEdit(group);
              }}
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className={[
                'fund-group-card__menu-item',
                'fund-group-card__menu-item--danger',
                !canDelete && 'fund-group-card__menu-item--disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!canDelete}
              title={
                group.isSystem
                  ? 'System groups cannot be deleted'
                  : fundCount > 0
                    ? `Move or archive all ${fundCount} fund(s) first`
                    : undefined
              }
              onClick={() => {
                if (canDelete) {
                  setMenuOpen(false);
                  onDelete(group);
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={rootClass}
      style={group.color ? ({ '--group-color': group.color } as React.CSSProperties) : undefined}
    >
      {asSection ? (
        // ── Section header mode ────────────────────────────────────────────
        <div className="fund-group-card__header">
          {/* Toggle button: chevron + dot + title */}
          <button
            type="button"
            className="fund-group-card__toggle-btn"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.name}`}
            onClick={onToggle}
            disabled={!onToggle}
          >
            <ChevronDown
              size={15}
              className={`fund-group-card__chevron${!isExpanded ? ' fund-group-card__chevron--collapsed' : ''}`}
              aria-hidden
            />
            <span
              className="fund-group-card__dot"
              style={{ backgroundColor: group.color ?? '#94a3b8' }}
            />
            <span className="fund-group-card__title-wrap">
              <span className="fund-group-card__name">{group.name}</span>
              {group.description && (
                <span className="fund-group-card__desc-inline">{group.description}</span>
              )}
            </span>
          </button>

          {/* Meta: fund count + total amount */}
          {!isArchived && (
            <span className="fund-group-card__section-meta">
              {fundCount} {fundCount === 1 ? 'fund' : 'funds'}
              {totalAmount != null && totalAmount > 0 && (
                <> · {formatINRCompact(totalAmount)}</>
              )}
            </span>
          )}

          {isArchived && <span className="fund-group-card__archived-badge">Archived</span>}

          {!isArchived && onAddFund && (
            <button
              type="button"
              className="fund-group-card__add-fund"
              aria-label={`Add fund to ${group.name}`}
              onClick={() => onAddFund(group.id)}
            >
              <Plus size={13} aria-hidden />
              Add fund
            </button>
          )}

          {isArchived && onRestore && (
            <button
              type="button"
              className="fund-group-card__restore"
              onClick={() => onRestore(group)}
            >
              Restore
            </button>
          )}

          {kebabMenu}
        </div>
      ) : (
        // ── Standalone card mode ───────────────────────────────────────────
        <>
          <div className="fund-group-card__header">
            <span
              className="fund-group-card__dot"
              style={{ backgroundColor: group.color ?? '#94a3b8' }}
            />
            <span className="fund-group-card__name">{group.name}</span>
            {isArchived && <span className="fund-group-card__archived-badge">Archived</span>}
            {kebabMenu}
          </div>

          {group.description && <p className="fund-group-card__desc">{group.description}</p>}

          <div className="fund-group-card__footer">
            {!isArchived && (
              <span className="fund-group-card__count">
                {fundCount} {fundCount === 1 ? 'fund' : 'funds'}
              </span>
            )}
            {isArchived && onRestore && (
              <button
                type="button"
                className="fund-group-card__restore"
                onClick={() => onRestore(group)}
              >
                Restore
              </button>
            )}
            {!isArchived && onAddFund && (
              <button
                type="button"
                className="fund-group-card__add-fund"
                aria-label={`Add fund to ${group.name}`}
                onClick={() => onAddFund(group.id)}
              >
                <Plus size={13} aria-hidden />
                Add fund
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
