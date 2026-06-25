'use client';

import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FundSummary, FundsAggregateSummary } from '@/modules/funds/funds.types';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
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

  return (
    <div className="fund-bucket-board">
      {/* Page header */}
      <div className="fund-bucket-board__page-header">
        <nav className="fund-bucket-board__breadcrumb" aria-label="Breadcrumb">
          <span className="fund-bucket-board__breadcrumb-item">Settings</span>
          <span className="fund-bucket-board__breadcrumb-sep" aria-hidden>›</span>
          <span className="fund-bucket-board__breadcrumb-item fund-bucket-board__breadcrumb-item--active">Funds</span>
        </nav>
        <div className="fund-bucket-board__heading-row">
          <div>
            <h1 className="fund-bucket-board__heading">Fund Buckets</h1>
            <p className="fund-bucket-board__heading-sub">Virtual allocation · every rupee has a purpose before it&apos;s spent</p>
          </div>
          <div className="fund-bucket-board__header-actions">
            {onRouting && (
              <Button size="sm" variant="secondary" onClick={onRouting} aria-label="Routing rules">
                <Zap size={13} aria-hidden /> Routing
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
      {summary && <UnallocatedCashAlert amount={summary.totalUnallocated} onAllocate={onAllocateIdle} />}

      {/* Fund card grid — always flat grid; groups shown in chip strip below */}
      <div className="fund-bucket-board__grid">
        {activeFunds.map((fund) => (
          <FundCard
            key={fund.id}
            fund={fund}
            onEdit={onEditFund}
            onAllocate={onAllocateFund}
            onArchive={onArchiveFund}
            onDelete={onDeleteFund}
          />
        ))}
        {activeFunds.length === 0 && (
          <button
            type="button"
            className="fund-bucket-board__empty-card"
            onClick={() => onCreateFund()}
            aria-label="Add your first fund"
          >
            <Plus size={18} aria-hidden />
            <span>Add your first fund</span>
          </button>
        )}
      </div>

      {/* Fund group cards */}
      {(groups.length > 0 || onCreateGroup) && (
        <div className="fund-bucket-board__groups-section">
          <div className="fund-bucket-board__groups-header">
            <h2 className="fund-bucket-board__groups-title">Fund Groups</h2>
            {onCreateGroup && (
              <Button size="sm" variant="secondary" onClick={onCreateGroup}>
                <Plus size={13} aria-hidden /> New Group
              </Button>
            )}
          </div>
          <div className="fund-bucket-board__groups-grid">
            {groups.map((group) => {
              const count = activeFunds.filter((f) => f.groupId === group.id).length;
              return (
                <FundGroupCard
                  key={group.id}
                  group={group}
                  fundCount={count}
                  onAddFund={group.archivedAt ? undefined : onCreateFund}
                  onEdit={group.archivedAt ? undefined : onEditGroup}
                  onDelete={group.archivedAt ? undefined : onDeleteGroup}
                  onRestore={group.archivedAt ? onRestoreGroup : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
