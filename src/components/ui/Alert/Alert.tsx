'use client';

import { Info, SquareCheck, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_CLASS: Record<AlertVariant, string> = {
  success: 'alert--success',
  error: 'alert--error',
  warning: 'alert--warning',
  info: 'alert--info',
};

const VARIANT_ICONS: Record<AlertVariant, LucideIcon> = {
  success: SquareCheck,
  error: TriangleAlert,
  warning: TriangleAlert,
  info: Info,
};

const VARIANT_TONE: Record<AlertVariant, 'success' | 'error' | 'warning' | 'brand'> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'brand',
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
}

export function alertClassName({
  variant = 'info',
  className = '',
}: {
  variant?: AlertVariant;
  className?: string;
}) {
  return ['alert', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  ...props
}: AlertProps) {
  return (
    <div
      className={alertClassName({ variant, className })}
      role="alert"
      {...props}
    >
      <Icon icon={VARIANT_ICONS[variant]} size="sm" tone={VARIANT_TONE[variant]} className="alert__icon" />
      <div className="alert__body">
        {title ? <p className="alert__title">{title}</p> : null}
        {children ? <p className="alert__message">{children}</p> : null}
      </div>
    </div>
  );
}
