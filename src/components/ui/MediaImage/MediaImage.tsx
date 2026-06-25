'use client';

import { IMAGE_LAZY_LOAD_MAX_WIDTH, type ImageAspect, type ImageRadius } from '@/constants/media';
import Image from 'next/image';
import { ImagePlaceholder } from './ImagePlaceholder';

export interface MediaImageProps {
  src?: string;
  alt: string;
  aspect?: ImageAspect;
  radius?: ImageRadius;
  width?: number;
  height?: number;
  placeholderLabel?: string;
  priority?: boolean;
  className?: string;
}

export function mediaImageClassName({
  aspect = '3-2',
  radius = 'md',
  className = '',
}: {
  aspect?: ImageAspect;
  radius?: ImageRadius;
  className?: string;
}) {
  return [
    'media-image',
    `media-image--aspect-${aspect}`,
    `media-image--radius-${radius}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function MediaImage({
  src,
  alt,
  aspect = '3-2',
  radius = 'md',
  width = 400,
  height = 300,
  placeholderLabel,
  priority = false,
  className = '',
}: MediaImageProps) {
  if (!src) {
    return (
      <ImagePlaceholder
        aspect={aspect}
        radius={radius}
        label={placeholderLabel ?? alt}
        className={className}
      />
    );
  }

  const shouldLazyLoad = width > IMAGE_LAZY_LOAD_MAX_WIDTH;

  return (
    <div className={mediaImageClassName({ aspect, radius, className })}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="media-image__img"
        loading={priority || !shouldLazyLoad ? undefined : 'lazy'}
        priority={priority}
      />
    </div>
  );
}
