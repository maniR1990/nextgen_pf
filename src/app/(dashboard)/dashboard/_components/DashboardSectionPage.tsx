import { EmptyState } from '@/components/ui/EmptyState';
import type { LucideIcon } from 'lucide-react';

export interface DashboardSectionPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function DashboardSectionPage({
  title,
  description = "This section isn't built yet — it's on the roadmap.",
  icon,
}: DashboardSectionPageProps) {
  return (
    <div>
      <EmptyState icon={icon} title={title} description={description} size="lg" />
    </div>
  );
}
