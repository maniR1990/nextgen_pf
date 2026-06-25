'use client';

import type { HTMLAttributes } from 'react';

export type ProgressVariant = 'brand' | 'success' | 'error' | 'warning';

const VARIANT_CLASS: Record<ProgressVariant, string> = {
  brand: 'progress--brand',
  success: 'progress--success',
  error: 'progress--error',
  warning: 'progress--warning',
};

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showValue?: boolean;
}

function resolveVariant(value: number, max: number, variant?: ProgressVariant): ProgressVariant {
  if (variant) return variant;
  if (value > max) return 'error';
  return 'brand';
}

export function progressClassName({
  variant = 'brand',
  className = '',
}: {
  variant?: ProgressVariant;
  className?: string;
}) {
  return ['progress', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export function Progress({
  label,
  value,
  max = 100,
  variant,
  showValue = true,
  className = '',
  ...props
}: ProgressProps) {
  const resolvedVariant = resolveVariant(value, max, variant);
  const percent = Math.round((value / max) * 100);
  const fillPercent = Math.min(percent, 100);

  return (
    <div
      className={progressClassName({ variant: resolvedVariant, className })}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      {...props}
    >
      <div className="progress__header">
        <span className="progress__label">{label}</span>
        {showValue && <span className="progress__value">{percent}%</span>}
      </div>
      <div className="progress__track">
        <div className="progress__bar" style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
}
