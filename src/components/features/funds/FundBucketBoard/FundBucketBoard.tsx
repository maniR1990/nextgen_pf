'use client';

import { Button } from '@/components/ui/Button';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import type { FundSummary, FundsAggregateSummary } from '@/modules/funds/funds.types';
import { Plus, Zap } from 'lucide-react';
import { FundCard } from '../FundCard';
import { FundGroupCard } from '../FundGroupCard/FundGroupCard';
import { FundHealthSummary } from '../FundHealthSummary';
import { UnallocatedCashAlert } from '../UnallocatedCashAlert';

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
  const activeFunds = funds.filter((f) => !f.archivedAt);
  const activeGroups = groups.filter((g) => !g.archivedAt);
  const archivedGroups = groups.filter((g) => !!g.archivedAt);

  // Map groupId → funds that belong to it
  const fundsByGroupId = activeFunds.reduce<Record<string, FundSummary[]>>((acc, fund) => {
    const key = fund.groupId ?? '__none__';
    (acc[key] ??= []).push(fund);
    return acc;
  }, {});

  const ungroupedFunds = fundsByGroupId['__none__'] ?? [];
  const hasContent = activeGroups.length > 0 || ungroupedFunds.length > 0;

  return (
    <div className="fund-bucket-board">
      {/* Page header */}
      <div className="fund-bucket-board__page-header">
        <nav className="fund-bucket-board__breadcrumb" aria-label="Breadcrumb">
          <span className="fund-bucket-board__breadcrumb-item">Settings</span>
          <span className="fund-bucket-board__breadcrumb-sep" aria-hidden>
            ›
          </span>
          <span className="fund-bucket-board__breadcrumb-item fund-bucket-board__breadcrumb-item--active">
            Funds
          </span>
        </nav>
        <div className="fund-bucket-board__heading-row">
          <div>
            <h1 className="fund-bucket-board__heading">Fund Buckets</h1>
            <p className="fund-bucket-board__heading-sub">
              Virtual allocation · every rupee has a purpose before it&apos;s spent
            </p>
          </div>
          <div className="fund-bucket-board__header-actions">
            {onRouting && (
              <Button size="sm" variant="secondary" onClick={onRouting} aria-label="Routing rules">
                <Zap size={13} aria-hidden /> Routing
              </Button>
            )}
            {onCreateGroup && (
              <Button size="sm" variant="secondary" onClick={onCreateGroup}>
                <Plus size={13} aria-hidden /> New Group
              </Button>
            )}
            <Button size="sm" onClick={() => onCreateFund()} aria-label="New fund">
              <Plus size={14} aria-hidden /> New Fund
            </Button>
          </div>
        </div>
      </div>

      {/* Stats + alert */}
      {summary && <FundHealthSummary summary={summary} />}
      {summary && (
        <UnallocatedCashAlert amount={summary.totalUnallocated} onAllocate={onAllocateIdle} />
      )}

      {/* Empty state — no groups and no funds yet */}
      {!hasContent && (
        <div className="fund-bucket-board__grid">
          <button
            type="button"
            className="fund-bucket-board__empty-card"
            onClick={() => onCreateFund()}
            aria-label="Add your first fund"
          >
            <Plus size={18} aria-hidden />
            <span>Add your first fund</span>
          </button>
        </div>
      )}

      {/* Active groups — each rendered as a section with its fund cards below */}
      {activeGroups.map((group) => {
        const groupFunds = fundsByGroupId[group.id] ?? [];
        return (
          <section key={group.id} className="fund-bucket-board__group-section">
            <FundGroupCard
              asSection
              group={group}
              fundCount={groupFunds.length}
              onAddFund={onCreateFund}
              onEdit={onEditGroup}
              onDelete={onDeleteGroup}
            />
            <div className="fund-bucket-board__grid">
              {groupFunds.map((fund) => (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  onEdit={onEditFund}
                  onAllocate={onAllocateFund}
                  onArchive={onArchiveFund}
                  onDelete={onDeleteFund}
                />
              ))}
              {groupFunds.length === 0 && (
                <button
                  type="button"
                  className="fund-bucket-board__empty-card"
                  onClick={() => onCreateFund(group.id)}
                  aria-label={`Add first fund to ${group.name}`}
                >
                  <Plus size={16} aria-hidden />
                  <span>Add first fund</span>
                </button>
              )}
            </div>
          </section>
        );
      })}

      {/* Ungrouped funds */}
      {ungroupedFunds.length > 0 && (
        <section className="fund-bucket-board__group-section fund-bucket-board__group-section--ungrouped">
          <div className="fund-bucket-board__ungrouped-header">
            <span className="fund-bucket-board__ungrouped-label">Ungrouped</span>
          </div>
          <div className="fund-bucket-board__grid">
            {ungroupedFunds.map((fund) => (
              <FundCard
                key={fund.id}
                fund={fund}
                onEdit={onEditFund}
                onAllocate={onAllocateFund}
                onArchive={onArchiveFund}
                onDelete={onDeleteFund}
              />
            ))}
          </div>
        </section>
      )}

      {/* Archived groups */}
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
  );
}
