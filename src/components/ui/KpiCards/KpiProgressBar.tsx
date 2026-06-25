import type { HTMLAttributes } from 'react';

export type KpiProgressVariant = 'brand' | 'success' | 'warning' | 'error';

const VARIANT_CLASS: Record<KpiProgressVariant, string> = {
  brand: 'kpi-progress--brand',
  success: 'kpi-progress--success',
  warning: 'kpi-progress--warning',
  error: 'kpi-progress--error',
};

export interface KpiProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  current: number;
  target: number;
  currentLabel?: string;
  targetLabel?: string;
  variant?: KpiProgressVariant;
  ariaLabel: string;
}

export function kpiProgressClassName({
  variant = 'brand',
  className = '',
}: {
  variant?: KpiProgressVariant;
  className?: string;
}) {
  return ['kpi-progress', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export function KpiProgressBar({
  current,
  target,
  currentLabel,
  targetLabel,
  variant = 'brand',
  ariaLabel,
  className = '',
  ...props
}: KpiProgressBarProps) {
  const fillPercent = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div
      className={kpiProgressClassName({ variant, className })}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={ariaLabel}
      {...props}
    >
      <div className="kpi-progress__track">
        <div className="kpi-progress__bar" style={{ width: `${fillPercent}%` }} />
      </div>
      {(currentLabel || targetLabel) && (
        <div className="kpi-progress__labels">
          {currentLabel ? <span className="kpi-progress__label">{currentLabel}</span> : <span />}
          {targetLabel ? <span className="kpi-progress__label">{targetLabel}</span> : null}
        </div>
      )}
    </div>
  );
}
