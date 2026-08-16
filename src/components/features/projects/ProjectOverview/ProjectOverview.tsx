'use client';

import { badgeClassName } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useCloseProject,
  useProjectDetail,
  useReopenProject,
  useUpdateProject,
} from '@/hooks/useProjects';
import type { ProjectStatus } from '@/hooks/useProjects';
import { useState } from 'react';
import { ProjectFormWizard } from '../ProjectFormWizard';
import { ProjectVendorList } from '../ProjectVendorList';
import { PROJECT_STATUS_BADGE_VARIANT, PROJECT_STATUS_LABEL } from '../projectStatusMeta';

const EDITABLE_STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD'];

export interface ProjectOverviewProps {
  projectId: string;
  /** Lets the "N open to-dos" chip jump straight to the Activity tab — see the
   *  Overview UX review, "add an Activity summary chip near the header". */
  onViewActivity?: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// "19 Aug 2026 · 4 days left" / "· 12 days overdue" — reuses data the app
// already holds (today, project status); never shown once a project is closed.
function relativeSuffix(targetIso: string | null, status: ProjectStatus): string {
  if (!targetIso || status === 'COMPLETED') return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetIso);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return ' · due today';
  if (days > 0) return ` · ${days} day${days === 1 ? '' : 's'} left`;
  return ` · ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
}

export function ProjectOverview({ projectId, onViewActivity }: ProjectOverviewProps) {
  const { data: project, isLoading } = useProjectDetail(projectId);
  const updateProject = useUpdateProject(projectId);
  const closeProject = useCloseProject(projectId);
  const reopenProject = useReopenProject(projectId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <p className="page-text">Loading…</p>;
  if (!project) return <p className="page-text">Project not found.</p>;

  const statusEditable = EDITABLE_STATUSES.includes(project.status);
  const statusOptions = statusEditable ? EDITABLE_STATUSES : [project.status, ...EDITABLE_STATUSES];
  const openTodos = project.todos.filter((t) => !t.done).length;
  const spendPct =
    project.forecastTotal > 0
      ? Math.round(Math.min(100, (project.spentTotal / project.forecastTotal) * 100))
      : 0;

  function handleClose() {
    const confirmed = window.confirm(
      "Close this project? You won't be able to log new expenses until you reopen it.",
    );
    if (confirmed) closeProject.mutate();
  }

  return (
    <div className="project-overview">
      <div className="project-overview__header">
        <div>
          <h1 className="page-heading">{project.name}</h1>
          {project.description && <p className="page-text">{project.description}</p>}
        </div>
        <div className="project-overview__header-actions">
          <select
            className={`${badgeClassName({ variant: PROJECT_STATUS_BADGE_VARIANT[project.status] })} project-overview__status-select`}
            value={project.status}
            disabled={!statusEditable}
            onChange={(e) =>
              updateProject.mutate({
                status: e.target.value as 'PLANNING' | 'ACTIVE' | 'ON_HOLD',
              })
            }
            aria-label="Project status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          {project.status === 'COMPLETED' ? (
            <Button
              variant="secondary"
              onClick={() => reopenProject.mutate()}
              disabled={reopenProject.isPending}
            >
              Reopen
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleClose} disabled={closeProject.isPending}>
              Close project
            </Button>
          )}
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="project-overview__stats">
        <div className="project-overview__stat">
          <span className="project-overview__field-label">Forecast</span>
          <span className="project-overview__stat-amount">
            ₹{project.forecastTotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="project-overview__stat">
          <span className="project-overview__field-label">Spent</span>
          <span className="project-overview__stat-amount">
            ₹{project.spentTotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="project-overview__stat">
          <span className="project-overview__field-label">Remaining</span>
          <span className="project-overview__stat-amount">
            ₹{Math.max(0, project.forecastTotal - project.spentTotal).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      {project.forecastTotal > 0 && (
        <div className="project-overview__bar-block">
          <div className="project-overview__bar">
            <div className="project-overview__bar-fill" style={{ width: `${spendPct}%` }} />
          </div>
          <span className="project-overview__bar-label">{spendPct}% of forecast spent</span>
        </div>
      )}

      {onViewActivity && openTodos > 0 && (
        <button type="button" className="project-overview__todo-chip" onClick={onViewActivity}>
          {openTodos} open to-do{openTodos === 1 ? '' : 's'}
        </button>
      )}

      <div className="project-overview__grid">
        <div className="project-overview__field">
          <span className="project-overview__field-label">Start date</span>
          <span>{formatDate(project.startDate)}</span>
        </div>

        <div className="project-overview__field">
          <span className="project-overview__field-label">Target completion</span>
          <span>
            {formatDate(project.targetCompletionDate)}
            {relativeSuffix(project.targetCompletionDate, project.status)}
          </span>
        </div>

        <div className="project-overview__field">
          <span className="project-overview__field-label">Funding source</span>
          <span>{project.fundingLabel ?? 'Not set'}</span>
        </div>
      </div>

      <ProjectVendorList
        projectId={projectId}
        vendors={project.vendors}
        forecastLines={project.forecastLines}
      />

      <ProjectFormWizard
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={project}
        onSubmit={(dto) => updateProject.mutateAsync(dto).then(() => {})}
      />
    </div>
  );
}
