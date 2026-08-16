'use client';

import { useProjectDetail } from '@/hooks/useProjects';

export interface ProjectSummaryReportProps {
  projectId: string;
}

function formatAmount(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function ProjectSummaryReport({ projectId }: ProjectSummaryReportProps) {
  const { data: project, isLoading } = useProjectDetail(projectId);

  if (isLoading) return <p className="page-text">Loading…</p>;
  if (!project) return <p className="page-text">Project not found.</p>;

  const plannedUnplannedTotal = project.plannedTotal + project.unplannedTotal;

  return (
    <div className="project-summary-report">
      <section className="project-activity__section">
        <span className="project-overview__field-label">Planned vs unplanned spend</span>
        <div className="project-overview__stats">
          <div className="project-overview__stat">
            <span className="project-overview__field-label">Planned</span>
            <span className="project-overview__stat-amount">
              {formatAmount(project.plannedTotal)}
            </span>
          </div>
          <div className="project-overview__stat">
            <span className="project-overview__field-label">Unplanned</span>
            <span className="project-overview__stat-amount">
              {formatAmount(project.unplannedTotal)}
            </span>
          </div>
          <div className="project-overview__stat">
            <span className="project-overview__field-label">Total spent</span>
            <span className="project-overview__stat-amount">
              {formatAmount(project.spentTotal)}
            </span>
          </div>
        </div>
        {plannedUnplannedTotal > 0 && (
          <div className="project-overview__bar">
            <div
              className="project-overview__bar-fill"
              style={{ width: `${(project.plannedTotal / plannedUnplannedTotal) * 100}%` }}
            />
          </div>
        )}
      </section>

      <section className="project-activity__section">
        <span className="project-overview__field-label">Spend by forecast line</span>
        {project.forecastLines.length === 0 ? (
          <p className="page-text">No forecast lines yet.</p>
        ) : (
          <div className="project-activity__list">
            {project.forecastLines.map((line) => (
              <div key={line.id} className="project-vendor-row">
                <div className="project-vendor-row__name">{line.description}</div>
                <div className="project-vendor-row__amounts">
                  <span>Forecast {formatAmount(line.forecastAmount)}</span>
                  <span>Actual {formatAmount(line.actualAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="project-activity__section">
        <span className="project-overview__field-label">Spend by vendor</span>
        {project.vendors.length === 0 ? (
          <p className="page-text">No vendors yet.</p>
        ) : (
          <div className="project-activity__list">
            {project.vendors.map((vendor) => (
              <div key={vendor.id} className="project-vendor-row">
                <div className="project-vendor-row__name">{vendor.name}</div>
                <div className="project-vendor-row__amounts">
                  <span>Contract {formatAmount(vendor.contractAmount)}</span>
                  <span>Paid {formatAmount(vendor.contractAmount - vendor.balance)}</span>
                  <span>Balance {formatAmount(vendor.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
