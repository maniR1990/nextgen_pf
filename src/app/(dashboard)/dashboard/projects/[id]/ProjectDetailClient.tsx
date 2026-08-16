'use client';

import { SegmentChipTabs } from '@/components/common/SegmentChipTabs';
import { LogProjectExpenseModal } from '@/components/features/projects/LogProjectExpenseModal';
import { ProjectActivity } from '@/components/features/projects/ProjectActivity';
import { ProjectBudgetForecast } from '@/components/features/projects/ProjectBudgetForecast';
import { ProjectLedger } from '@/components/features/projects/ProjectLedger';
import { ProjectOverview } from '@/components/features/projects/ProjectOverview';
import { ProjectSummaryReport } from '@/components/features/projects/ProjectSummaryReport';
import { Button } from '@/components/ui/Button';
import { useProjectDetail } from '@/hooks/useProjects';
import { ArrowLeft, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'forecast', label: 'Budget forecast' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'activity', label: 'Activity' },
  { id: 'reports', label: 'Reports' },
];

export function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tab, setTab] = useState('overview');
  const [logOpen, setLogOpen] = useState(false);
  const { data: project } = useProjectDetail(id);

  return (
    <div className="project-detail">
      <nav className="project-detail__nav" aria-label="Page navigation">
        <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft size={14} aria-hidden />
          Projects
        </Button>
      </nav>

      <div className="project-detail__tabs-row">
        <SegmentChipTabs
          items={TABS}
          value={tab}
          onChange={setTab}
          aria-label="Project sections"
          className="project-detail__tabs"
        />
        {project && project.status !== 'COMPLETED' && (
          <Button variant="secondary" size="sm" onClick={() => setLogOpen(true)}>
            <Plus size={14} aria-hidden />
            Log expense
          </Button>
        )}
      </div>

      {tab === 'overview' && (
        <ProjectOverview projectId={id} onViewActivity={() => setTab('activity')} />
      )}
      {tab === 'forecast' && <ProjectBudgetForecast projectId={id} />}
      {tab === 'ledger' && <ProjectLedger projectId={id} onAdd={() => setLogOpen(true)} />}
      {tab === 'activity' && <ProjectActivity projectId={id} />}
      {tab === 'reports' && <ProjectSummaryReport projectId={id} />}

      {project && (
        <LogProjectExpenseModal
          open={logOpen}
          onClose={() => setLogOpen(false)}
          project={project}
        />
      )}
    </div>
  );
}
