'use client';

import { Target } from 'lucide-react';
import { DashboardSectionPage } from '../_components/DashboardSectionPage';

export default function GoalsPage() {
  return (
    <DashboardSectionPage
      title="Goals"
      description="Savings and spending goals are on the roadmap — not built yet."
      icon={Target}
    />
  );
}
