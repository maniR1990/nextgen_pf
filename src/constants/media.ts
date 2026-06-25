/** Standard image aspect ratios for UI treatments */
export const IMAGE_ASPECTS = {
  '1-1': { label: 'Avatar', ratio: '1 / 1' },
  '3-2': { label: 'Card', ratio: '3 / 2' },
  '16-9': { label: 'Banner', ratio: '16 / 9' },
  '3-4': { label: 'Portrait', ratio: '3 / 4' },
} as const;

export type ImageAspect = keyof typeof IMAGE_ASPECTS;

export const IMAGE_RADII = ['none', 'sm', 'md', 'lg', 'full'] as const;

export type ImageRadius = (typeof IMAGE_RADII)[number];

/** Images wider than this should use lazy loading (Next/Image or IntersectionObserver) */
export const IMAGE_LAZY_LOAD_MAX_WIDTH = 1200;
