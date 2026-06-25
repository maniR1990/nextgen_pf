import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'active'
  | 'success'
  | 'error'
  | 'warning'
  | 'inactive'
  | 'beta'
  | 'admin'
  | 'pro'
  | 'free'
  | 'verified';

export type BadgeKind = 'status' | 'label';

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  active: 'badge--active',
  success: 'badge--success',
  error: 'badge--error',
  warning: 'badge--warning',
  inactive: 'badge--inactive',
  beta: 'badge--beta',
  admin: 'badge--admin',
  pro: 'badge--pro',
  free: 'badge--free',
  verified: 'badge--verified',
};

const LABEL_VARIANTS = new Set<BadgeVariant>(['admin', 'pro', 'free', 'verified']);
const DOT_VARIANTS = new Set<BadgeVariant>(['active', 'success', 'error', 'warning']);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  kind?: BadgeKind;
  dot?: boolean;
  children: ReactNode;
}

export function badgeClassName({
  variant = 'active',
  kind,
  className = '',
}: {
  variant?: BadgeVariant;
  kind?: BadgeKind;
  className?: string;
}) {
  const resolvedKind = kind ?? (LABEL_VARIANTS.has(variant) ? 'label' : 'status');
  return ['badge', VARIANT_CLASS[variant], resolvedKind === 'label' && 'badge--label', className]
    .filter(Boolean)
    .join(' ');
}

export function Badge({
  variant = 'active',
  kind,
  dot,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const resolvedKind = kind ?? (LABEL_VARIANTS.has(variant) ? 'label' : 'status');
  const showDot = dot ?? (resolvedKind === 'status' && DOT_VARIANTS.has(variant));

  return (
    <span className={badgeClassName({ variant, kind: resolvedKind, className })} {...props}>
      {showDot && <span className="badge__dot" aria-hidden />}
      <span className="badge__text">{children}</span>
    </span>
  );
}
