'use client';

import { Button } from '@/components/ui/Button';
import { formatINRCompact } from '@/lib/utils/format';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import type { FundSummary, FundsAggregateSummary } from '@/modules/funds/funds.types';
import { AlertTriangle, Plus, Search, X, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FundGroupCard } from '../FundGroupCard/FundGroupCard';
import { FundListRow } from '../FundListRow/FundListRow';

// Financial priority order: safety first, wealth last
const PURPOSE_ORDER: Record<string, number> = {
  EMERGENCY: 0,
  INSURANCE: 1,
  OPS: 2,
  TAX: 3,
  SINKING: 4,
  GOAL: 5,
  INVESTMENT: 6,
  WEALTH: 7,
};

function sortFunds(funds: FundSummary[]): FundSummary[] {
  return [...funds].sort((a, b) => {
    const healthA = a.percentFilled >= 100 ? 2 : a.percentFilled >= 50 ? 1 : 0;
    const healthB = b.percentFilled >= 100 ? 2 : b.percentFilled >= 50 ? 1 : 0;
    if (healthA !== healthB) return healthA - healthB;
    const purposeA = PURPOSE_ORDER[a.purpose] ?? 99;
    const purposeB = PURPOSE_ORDER[b.purpose] ?? 99;
    if (purposeA !== purposeB) return purposeA - purposeB;
    return a.percentFilled - b.percentFilled;
  });
}

function sortGroups(groups: FundGroupSummary[]): FundGroupSummary[] {
  return [...groups].sort((a, b) => {
    const pa = a.purposeHint != null ? (PURPOSE_ORDER[a.purposeHint] ?? 99) : 99;
    const pb = b.purposeHint != null ? (PURPOSE_ORDER[b.purposeHint] ?? 99) : 99;
    if (pa !== pb) return pa - pb;
    return a.order - b.order;
  });
}

export interface FundBucketBoardProps {
  groups: FundGroupSummary[];
  funds: FundSummary[];
  summary?: FundsAggregateSummary;
  onCreateFund: (groupId?: string) => void;
  onEditFund?: (fund: FundSummary) => void;
  onAllocateFund?: (fund: FundSummary) => void;
  onArchiveFund?: (fund: FundSummary) => void;
  onDeleteFund?: (fund: FundSummary) => void;
  onAllocateIdle?: () => void;
  onCreateGroup?: () => void;
  onEditGroup?: (group: FundGroupSummary) => void;
  onDeleteGroup?: (group: FundGroupSummary) => void;
  onRestoreGroup?: (group: FundGroupSummary) => void;
  onRouting?: () => void;
}

export function FundBucketBoard({
  groups,
  funds,
  summary,
  onCreateFund,
  onEditFund,
  onAllocateFund,
  onArchiveFund,
  onDeleteFund,
  onAllocateIdle,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onRestoreGroup,
  onRouting,
}: FundBucketBoardProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const activeFunds = funds.filter((f) => !f.archivedAt);
  const activeGroups = sortGroups(groups.filter((g) => !g.archivedAt));
  const archivedGroups = groups.filter((g) => !!g.archivedAt);

  const filteredFunds = isSearching
    ? activeFunds.filter((f) => f.name.toLowerCase().includes(normalizedQuery))
    : activeFunds;

  const fundsByGroupId = filteredFunds.reduce<Record<string, FundSummary[]>>((acc, fund) => {
    const key = fund.groupId ?? '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(fund);
    return acc;
  }, {});

  for (const key of Object.keys(fundsByGroupId)) {
    fundsByGroupId[key] = sortFunds(fundsByGroupId[key]);
  }

  const ungroupedFunds = fundsByGroupId.__none__ ?? [];

  const visibleGroups = isSearching
    ? activeGroups.filter((g) => (fundsByGroupId[g.id]?.length ?? 0) > 0)
    : activeGroups;

  const totalMatchCount = filteredFunds.length;
  const hasContent = activeGroups.length > 0 || activeFunds.length > 0;
  const hasSearchResults = isSearching ? totalMatchCount > 0 : hasContent;

  const activeFundCount = summary?.fundHealthRadar.length ?? 0;
  const onTargetCount = summary
    ? summary.fundHealthRadar.filter((f) => f.health === 'healthy' || f.health === 'ok').length
    : 0;
  const hasIdle = (summary?.totalUnallocated ?? 0) > 0;

  return (
    <div className="fund-bucket-board">
      {/* ── Compact toolbar ───────────────────────────────────────────────── */}
      <div className="fund-bucket-board__toolbar">
        <h1 className="fund-bucket-board__title">Fund Buckets</h1>

        {hasContent && (
          <div className="fund-bucket-board__search-wrap">
            <span className="fund-bucket-board__search-icon" aria-hidden>
              <Search size={14} />
            </span>
            <input
              type="search"
              className="fund-bucket-board__search-input"
              placeholder="Search funds…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search funds"
            />
            {isSearching && (
              <button
                type="button"
                className="fund-bucket-board__search-clear"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} aria-hidden />
              </button>
            )}
          </div>
        )}

        <div className="fund-bucket-board__toolbar-end">
          {onRouting && (
            <Button size="sm" variant="ghost" onClick={onRouting} aria-label="Routing rules">
              <Zap size={13} aria-hidden /> Routing
            </Button>
          )}
          {onCreateGroup && (
            <Button size="sm" variant="secondary" onClick={onCreateGroup}>
              <Plus size={13} aria-hidden /> Group
            </Button>
          )}
          <Button size="sm" onClick={() => onCreateFund()} aria-label="New fund">
            <Plus size={14} aria-hidden /> New Fund
          </Button>
        </div>
      </div>

      {/* ── Inline stats strip ────────────────────────────────────────────── */}
      {summary && (
        <div className="fund-bucket-board__stats">
          <div className="fund-bucket-board__stat">
            <span className="fund-bucket-board__stat-val">
              {formatINRCompact(summary.totalAllocated)}
            </span>
            <span className="fund-bucket-board__stat-label">allocated</span>
          </div>

          <span className="fund-bucket-board__stat-sep" aria-hidden />

          <div
            className={`fund-bucket-board__stat${hasIdle ? ' fund-bucket-board__stat--warn' : ''}`}
          >
            {hasIdle && (
              <AlertTriangle size={12} className="fund-bucket-board__stat-alert-icon" aria-hidden />
            )}
            <span className="fund-bucket-board__stat-val">
              {formatINRCompact(summary.totalUnallocated)}
            </span>
            <span className="fund-bucket-board__stat-label">
              idle
              {hasIdle && onAllocateIdle && (
                <button
                  type="button"
                  className="fund-bucket-board__allocate-link"
                  onClick={onAllocateIdle}
                >
                  Allocate →
                </button>
              )}
            </span>
          </div>

          <span className="fund-bucket-board__stat-sep" aria-hidden />

          <div className="fund-bucket-board__stat">
            <span className="fund-bucket-board__stat-val">{activeFundCount}</span>
            <span className="fund-bucket-board__stat-label">
              {activeFundCount === 1 ? 'fund' : 'funds'}
            </span>
          </div>

          <span className="fund-bucket-board__stat-sep" aria-hidden />

          <div
            className={`fund-bucket-board__stat${
              activeFundCount > 0 && onTargetCount === activeFundCount
                ? ' fund-bucket-board__stat--good'
                : ''
            }`}
          >
            <span className="fund-bucket-board__stat-val">
              {onTargetCount}/{activeFundCount}
            </span>
            <span className="fund-bucket-board__stat-label">on target</span>
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="fund-bucket-board__body">
        {!hasContent && (
          <div className="fund-bucket-board__empty-state">
            <button
              type="button"
              className="fund-bucket-board__empty-card"
              onClick={() => onCreateFund()}
              aria-label="Add your first fund"
            >
              <Plus size={16} aria-hidden />
              <span>Add your first fund</span>
            </button>
          </div>
        )}

        {isSearching && !hasSearchResults && (
          <div className="fund-bucket-board__no-results">
            <span className="fund-bucket-board__no-results-label">No funds found</span>
            <span>No funds match &ldquo;{searchQuery}&rdquo;</span>
          </div>
        )}

        {visibleGroups.map((group) => {
          const groupFunds = fundsByGroupId[group.id] ?? [];
          const isExpanded = isSearching ? true : !collapsedGroups.has(group.id);
          const totalAmount = groupFunds.reduce((s, f) => s + f.currentAmount, 0);

          return (
            <section key={group.id} className="fund-bucket-board__group-section">
              <FundGroupCard
                asSection
                group={group}
                fundCount={groupFunds.length}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.id)}
                totalAmount={totalAmount}
                onAddFund={onCreateFund}
                onEdit={onEditGroup}
                onDelete={onDeleteGroup}
              />
              <div
                className={`fund-bucket-board__group-body${
                  !isExpanded ? ' fund-bucket-board__group-body--collapsed' : ''
                }`}
              >
                <div className="fund-bucket-board__group-body-inner">
                  {groupFunds.length > 0 ? (
                    <ul className="fund-list-rows">
                      {groupFunds.map((fund) => (
                        <FundListRow
                          key={fund.id}
                          fund={fund}
                          onEdit={onEditFund}
                          onAllocate={onAllocateFund}
                          onArchive={onArchiveFund}
                          onDelete={onDeleteFund}
                        />
                      ))}
                    </ul>
                  ) : (
                    <button
                      type="button"
                      className="fund-bucket-board__empty-card"
                      onClick={() => onCreateFund(group.id)}
                      aria-label={`Add first fund to ${group.name}`}
                    >
                      <Plus size={14} aria-hidden />
                      <span>Add first fund to {group.name}</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {ungroupedFunds.length > 0 && (
          <section className="fund-bucket-board__group-section fund-bucket-board__group-section--ungrouped">
            <div className="fund-bucket-board__ungrouped-header">
              <span className="fund-bucket-board__ungrouped-label">Ungrouped</span>
            </div>
            <ul className="fund-list-rows">
              {ungroupedFunds.map((fund) => (
                <FundListRow
                  key={fund.id}
                  fund={fund}
                  onEdit={onEditFund}
                  onAllocate={onAllocateFund}
                  onArchive={onArchiveFund}
                  onDelete={onDeleteFund}
                />
              ))}
            </ul>
          </section>
        )}

        {archivedGroups.length > 0 && (
          <section className="fund-bucket-board__archived-section">
            <p className="fund-bucket-board__archived-label">Archived groups</p>
            {archivedGroups.map((group) => (
              <FundGroupCard
                key={group.id}
                asSection
                group={group}
                fundCount={0}
                onRestore={onRestoreGroup}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
