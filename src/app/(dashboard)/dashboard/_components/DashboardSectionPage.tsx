export interface DashboardSectionPageProps {
  title: string;
  description?: string;
}

export function DashboardSectionPage({ title, description }: DashboardSectionPageProps) {
  return (
    <div>
      <h1 className="page-heading">{title}</h1>
      {description ? <p className="page-text">{description}</p> : null}
    </div>
  );
}
