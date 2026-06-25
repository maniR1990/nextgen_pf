'use client';

import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

function toCssSize(value: string | number | undefined) {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function skeletonClassName({
  variant = 'text',
  className = '',
}: {
  variant?: SkeletonVariant;
  className?: string;
}) {
  const variantClass =
    variant === 'circle'
      ? 'skeleton--circle'
      : variant === 'rect'
        ? 'skeleton--rect'
        : 'skeleton--text';
  return ['skeleton', variantClass, className].filter(Boolean).join(' ');
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const inlineStyle: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
    ...style,
  };

  return (
    <span
      className={skeletonClassName({ variant, className })}
      style={inlineStyle}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={['skeleton-card', className].filter(Boolean).join(' ')}
      aria-busy
      aria-label="Loading"
    >
      <div className="skeleton-card__top">
        <Skeleton variant="circle" />
        <div className="skeleton-card__body">
          <div className="skeleton-card__row">
            <Skeleton className="skeleton-card__line-primary" />
            <Skeleton variant="rect" className="skeleton-card__badge" />
          </div>
          <Skeleton variant="text" />
          <Skeleton variant="text" className="skeleton-card__line-short" />
        </div>
      </div>
      <Skeleton variant="rect" className="skeleton-card__footer" />
    </div>
  );
}
