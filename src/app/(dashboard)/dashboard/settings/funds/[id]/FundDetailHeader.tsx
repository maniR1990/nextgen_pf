import type { FundSummary } from '@/modules/funds/funds.types';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';

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

function HealthIcon({ pct }: { pct: number }) {
  if (pct >= 100)
    return (
      <CheckCircle2
        size={13}
        className="fund-detail__health-icon fund-detail__health-icon--healthy"
        aria-hidden
      />
    );
  if (pct >= 50)
    return (
      <Circle
        size={13}
        className="fund-detail__health-icon fund-detail__health-icon--ok"
        aria-hidden
      />
    );
  return (
    <AlertCircle
      size={13}
      className="fund-detail__health-icon fund-detail__health-icon--low"
      aria-hidden
    />
  );
}

export function FundDetailHeader({ fund }: { fund: FundSummary }) {
  const fillPct = Math.min(100, Math.max(0, fund.percentFilled));
  const isComplete = fund.percentFilled >= 100;
  const purposeLabel = PURPOSE_LABEL[fund.purpose] ?? fund.purpose;
  const groupDesc = fund.groupDescription ?? fund.groupName;
  const subtitle = groupDesc ? `${purposeLabel} · ${groupDesc}` : purposeLabel;

  return (
    <div className="fund-detail__header">
      <div className="fund-detail__header-left">
        {fund.icon && (
          <span className="fund-detail__icon" aria-hidden>
            {fund.icon}
          </span>
        )}
        <div className="fund-detail__header-info">
          <div className="fund-detail__title-row">
            <h1 className="fund-detail__title">{fund.name}</h1>
            <HealthIcon pct={fund.percentFilled} />
          </div>
          <p className="fund-detail__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="fund-detail__header-right">
        <div className="fund-detail__stats">
          <div className="fund-detail__stat">
            <span className="fund-detail__stat-value">₹{formatINR(fund.currentAmount)}</span>
            <span className="fund-detail__stat-label">Current</span>
          </div>
          <div className="fund-detail__stat fund-detail__stat--center">
            <span className="fund-detail__stat-value">
              {Math.round(fund.percentFilled)}%{isComplete ? ' ✓' : ''}
            </span>
            <span className="fund-detail__stat-label">Filled</span>
          </div>
          <div className="fund-detail__stat">
            <span className="fund-detail__stat-value">
              {fund.targetAmount > 0 ? `₹${formatINR(fund.targetAmount)}` : '∞'}
            </span>
            <span className="fund-detail__stat-label">Target</span>
          </div>
        </div>

        <div
          className="fund-detail__progress"
          role="progressbar"
          aria-valuenow={fillPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${fund.name}: ${Math.round(fillPct)}% filled`}
        >
          <div className="fund-detail__progress-fill" style={{ width: `${fillPct}%` }} />
        </div>
      </div>
    </div>
  );
}
