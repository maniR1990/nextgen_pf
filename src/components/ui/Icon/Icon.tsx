'use client';

import type { LucideIcon } from 'lucide-react';
import type { SVGProps } from 'react';
import { ICON_SIZES, ICON_STROKE_WIDTH, type IconSize } from '@/constants/icons';

export type IconTone = 'inherit' | 'muted' | 'brand' | 'success' | 'warning' | 'error';

const TONE_CLASS: Record<Exclude<IconTone, 'inherit'>, string> = {
  muted: 'icon--muted',
  brand: 'icon--brand',
  success: 'icon--success',
  warning: 'icon--warning',
  error: 'icon--error',
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  icon: LucideIcon;
  size?: IconSize;
  tone?: IconTone;
}

export function iconClassName({
  size = 'md',
  tone = 'inherit',
  className = '',
}: {
  size?: IconSize;
  tone?: IconTone;
  className?: string;
}) {
  return [
    'icon',
    `icon--${size}`,
    tone !== 'inherit' && TONE_CLASS[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Icon({
  icon: LucideComponent,
  size = 'md',
  tone = 'inherit',
  className = '',
  strokeWidth = ICON_STROKE_WIDTH,
  ...props
}: IconProps) {
  const pixelSize = ICON_SIZES[size];
  const ariaHidden = props['aria-label'] ? undefined : props['aria-hidden'] ?? true;

  return (
    <LucideComponent
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={iconClassName({ size, tone, className })}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
