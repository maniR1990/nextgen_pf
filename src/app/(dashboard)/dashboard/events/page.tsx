'use client';

import { CalendarClock } from 'lucide-react';
import { DashboardSectionPage } from '../_components/DashboardSectionPage';

export default function EventsPage() {
  return (
    <DashboardSectionPage
      title="Events"
      description="Tracking one-off financial events is on the roadmap — not built yet."
      icon={CalendarClock}
    />
  );
}
