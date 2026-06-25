import type { ImageAspect, ImageRadius } from '@/constants/media';
import type { HTMLAttributes } from 'react';

export interface ImagePlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  aspect?: ImageAspect;
  radius?: ImageRadius;
  label?: string;
}

export function imagePlaceholderClassName({
  aspect = '3-2',
  radius = 'md',
  className = '',
}: {
  aspect?: ImageAspect;
  radius?: ImageRadius;
  className?: string;
}) {
  return [
    'image-placeholder',
    `image-placeholder--aspect-${aspect}`,
    `image-placeholder--radius-${radius}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function ImagePlaceholder({
  aspect = '3-2',
  radius = 'md',
  label = 'Product Image',
  className = '',
  ...props
}: ImagePlaceholderProps) {
  return (
    <div
      className={imagePlaceholderClassName({ aspect, radius, className })}
      role="img"
      aria-label={label}
      {...props}
    >
      {label}
    </div>
  );
}
