'use client';

import { Info, SquareCheck, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: 'toast--success',
  error: 'toast--error',
  warning: 'toast--warning',
  info: 'toast--info',
};

const VARIANT_ICONS: Record<ToastVariant, LucideIcon> = {
  success: SquareCheck,
  error: X,
  warning: TriangleAlert,
  info: Info,
};

const VARIANT_TONE: Record<ToastVariant, 'success' | 'error' | 'warning' | 'brand'> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'brand',
};

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  title: string;
  description?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function toastClassName({
  variant = 'info',
  className = '',
}: {
  variant?: ToastVariant;
  className?: string;
}) {
  return ['toast', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export function Toast({
  variant = 'info',
  title,
  description,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  className = '',
  ...props
}: ToastProps) {
  const isAssertive = variant === 'error' || variant === 'warning';

  return (
    <div
      className={toastClassName({ variant, className })}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      {...props}
    >
      <Icon
        icon={VARIANT_ICONS[variant]}
        size="lg"
        tone={VARIANT_TONE[variant]}
        className="toast__icon"
      />
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {description && <p className="toast__description">{description}</p>}
      </div>
      {onDismiss && (
        <button type="button" className="toast__dismiss" onClick={onDismiss} aria-label={dismissLabel}>
          <Icon icon={X} size="sm" tone="muted" />
        </button>
      )}
    </div>
  );
}
