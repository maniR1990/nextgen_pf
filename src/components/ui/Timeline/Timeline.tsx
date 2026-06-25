import {
  TIMELINE_DEFAULT_DENSITY,
  type TimelineDensity,
} from '@/constants/timeline';
import { TimelineItem } from './TimelineItem';
import type { TimelineConfigJson } from './schemas';

export interface TimelineProps {
  config: TimelineConfigJson;
  density?: TimelineDensity;
  className?: string;
}

export function timelineClassName({
  variant,
  density = TIMELINE_DEFAULT_DENSITY,
  className = '',
}: {
  variant: TimelineConfigJson['variant'];
  density?: TimelineDensity;
  className?: string;
}) {
  return ['timeline', `timeline--${variant}`, `timeline--${density}`, className]
    .filter(Boolean)
    .join(' ');
}

export function Timeline({
  config,
  density = TIMELINE_DEFAULT_DENSITY,
  className = '',
}: TimelineProps) {
  return (
    <ol className={timelineClassName({ variant: config.variant, density, className })} aria-label={config.ariaLabel}>
      {config.items.map((item) => (
        <TimelineItem key={item.id} item={item} />
      ))}
    </ol>
  );
}
