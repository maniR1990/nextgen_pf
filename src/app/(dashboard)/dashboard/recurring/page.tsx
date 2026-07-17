'use client';

import { Repeat } from 'lucide-react';
import { DashboardSectionPage } from '../_components/DashboardSectionPage';

export default function RecurringPage() {
  return (
    <DashboardSectionPage
      title="Recurring"
      description="A dedicated view for managing recurring transactions is on the roadmap — not built yet."
      icon={Repeat}
    />
  );
}
