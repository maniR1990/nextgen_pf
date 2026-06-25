'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ChipVariant = 'brand' | 'success' | 'neutral';
export type ChipAction = 'remove' | 'add' | 'none';

const VARIANT_CLASS: Record<ChipVariant, string> = {
  brand: 'chip--brand',
  success: 'chip--success',
  neutral: 'chip--neutral',
};

function CloseIcon() {
  return (
    <svg className="chip__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 4.22Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="chip__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 3.5a.75.75 0 0 1 .75.75V7h2.75a.75.75 0 0 1 0 1.5H8.75v2.75a.75.75 0 0 1-1.5 0V8.5H4.5a.75.75 0 0 1 0-1.5h2.75V4.25A.75.75 0 0 1 8 3.5Z" />
    </svg>
  );
}

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ChipVariant;
  action?: ChipAction;
  children: ReactNode;
}

export function chipClassName({
  variant = 'brand',
  action = 'none',
  className = '',
}: {
  variant?: ChipVariant;
  action?: ChipAction;
  className?: string;
}) {
  return [
    'chip',
    VARIANT_CLASS[variant],
    action === 'add' && 'chip--add',
    action === 'remove' && 'chip--remove',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Chip({
  variant = 'brand',
  action = 'none',
  children,
  className = '',
  type = 'button',
  ...props
}: ChipProps) {
  const isInteractive = action !== 'none';

  if (!isInteractive) {
    return (
      <span className={chipClassName({ variant, action, className })}>
        <span className="chip__text">{children}</span>
      </span>
    );
  }

  const actionLabel = action === 'add' ? String(children) : `Remove ${children}`;

  return (
    <button
      type={type}
      className={chipClassName({ variant, action, className })}
      aria-label={props['aria-label'] ?? actionLabel}
      {...props}
    >
      {action === 'remove' && <CloseIcon />}
      {action === 'add' && <PlusIcon />}
      <span className="chip__text">{children}</span>
    </button>
  );
}
