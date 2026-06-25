'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'neutral';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export type ButtonShape = 'default' | 'pill';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  loadingText?: string;
  /** Storybook / visual regression only */
  visualState?: 'hover' | 'focus';
  children?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string | null> = {
  primary: null,
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
  success: 'btn--success',
  neutral: 'btn--neutral',
};

const SIZE_CLASS: Record<ButtonSize, string | null> = {
  sm: 'btn--sm',
  md: null,
  lg: 'btn--lg',
  icon: 'btn--icon',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  loading = false,
  className = '',
}: Pick<ButtonProps, 'variant' | 'size' | 'shape' | 'loading' | 'className'>) {
  return [
    'btn',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    shape === 'pill' && 'btn--pill',
    loading && 'btn--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  loading = false,
  loadingText = 'Loading...',
  visualState,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isIconOnly = size === 'icon';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-state={visualState}
      className={buttonClassName({ variant, size, shape, loading, className })}
      {...props}
    >
      {loading ? (
        <span className="btn__label">
          <span className="btn__spinner" role="progressbar" aria-label="Loading" />
          {!isIconOnly ? loadingText : null}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
