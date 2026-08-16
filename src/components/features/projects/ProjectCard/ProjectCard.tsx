'use client';

import { Badge } from '@/components/ui/Badge';
import type { ProjectListItem } from '@/hooks/useProjects';
import Link from 'next/link';
import { PROJECT_STATUS_BADGE_VARIANT, PROJECT_STATUS_LABEL } from '../projectStatusMeta';

export interface ProjectCardProps {
  project: ProjectListItem;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function ProjectCard({ project }: ProjectCardProps) {
  const start = formatDate(project.startDate);
  const target = formatDate(project.targetCompletionDate);

  return (
    <Link href={`/dashboard/projects/${project.id}`} className="project-card">
      <div className="project-card__top">
        <span className="project-card__name">{project.name}</span>
        <Badge variant={PROJECT_STATUS_BADGE_VARIANT[project.status]}>
          {PROJECT_STATUS_LABEL[project.status]}
        </Badge>
      </div>
      {project.description && <p className="project-card__description">{project.description}</p>}
      <div className="project-card__meta">
        {project.fundingLabel && <span>Funded from {project.fundingLabel}</span>}
        {(start || target) && (
          <span>
            {start ?? '—'} → {target ?? 'no target date'}
          </span>
        )}
      </div>
    </Link>
  );
}
