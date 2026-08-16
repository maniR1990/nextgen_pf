import type { BadgeVariant } from '@/components/ui/Badge';
import type { ProjectStatus } from '@/hooks/useProjects';

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Ongoing',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const PROJECT_STATUS_BADGE_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  PLANNING: 'inactive',
  ACTIVE: 'active',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'inactive',
};
