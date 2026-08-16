'use client';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCreateProject, useProjectsList } from '@/hooks/useProjects';
import type { ProjectStatus } from '@/hooks/useProjects';
import { Briefcase, Plus } from 'lucide-react';
import { useState } from 'react';
import { ProjectCard } from '../ProjectCard';
import { ProjectFormWizard } from '../ProjectFormWizard';

const STATUS_SECTIONS: { status: ProjectStatus; label: string }[] = [
  { status: 'ACTIVE', label: 'Ongoing' },
  { status: 'ON_HOLD', label: 'On hold' },
  { status: 'PLANNING', label: 'Upcoming — planning' },
  { status: 'COMPLETED', label: 'Completed' },
];

export function ProjectList() {
  const { data: projects, isLoading } = useProjectsList();
  const createProject = useCreateProject();
  const [wizardOpen, setWizardOpen] = useState(false);

  const grouped = STATUS_SECTIONS.map(({ status, label }) => ({
    status,
    label,
    items: (projects ?? []).filter((p) => p.status === status),
  })).filter((group) => group.items.length > 0);

  const isEmpty = !isLoading && grouped.length === 0;

  return (
    <div className="projects-page">
      <div className="projects-page__header">
        <h1 className="page-heading">Projects</h1>
        <Button variant="secondary" onClick={() => setWizardOpen(true)}>
          <Plus size={15} aria-hidden />
          New project
        </Button>
      </div>

      {isEmpty && (
        <EmptyState
          icon={Briefcase}
          title="Start your first project"
          description="Track a large one-off spend — like a renovation — separately from your monthly budget."
          actionLabel="New project"
          onAction={() => setWizardOpen(true)}
        />
      )}

      {grouped.map((group) => (
        <section key={group.status} className="projects-page__section">
          <h2 className="projects-page__section-label">{group.label}</h2>
          <div className="projects-page__list">
            {group.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}

      <ProjectFormWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={(dto) => createProject.mutateAsync(dto).then(() => {})}
      />
    </div>
  );
}
