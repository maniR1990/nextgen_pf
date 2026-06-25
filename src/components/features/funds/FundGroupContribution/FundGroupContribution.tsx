'use client';

export interface FundGroupContributionProps {
  fundGroupName: string;
  netContributed: number;
  targetAmount: number | null;
  progressPct: number | null;
}

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export function FundGroupContribution({
  fundGroupName,
  netContributed,
  targetAmount,
  progressPct,
}: FundGroupContributionProps) {
  const displayPct = progressPct !== null ? Math.min(100, progressPct) : null;

  return (
    <div className="fund-group-contribution">
      <p className="fund-group-contribution__label">Total Contributed (Net)</p>
      <p className="fund-group-contribution__amount">₹{formatINR(netContributed)}</p>

      {targetAmount !== null && displayPct !== null && (
        <>
          <p className="fund-group-contribution__target">
            of ₹{formatINR(targetAmount)} target
          </p>
          <div
            role="progressbar"
            aria-label={`${fundGroupName} contribution progress`}
            aria-valuenow={displayPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="fund-group-contribution__bar"
          >
            <div
              className="fund-group-contribution__bar-fill"
              style={{ width: `${displayPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
