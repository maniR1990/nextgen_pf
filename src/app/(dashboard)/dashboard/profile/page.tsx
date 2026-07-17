'use client';

import { User } from 'lucide-react';
import { DashboardSectionPage } from '../_components/DashboardSectionPage';

export default function ProfilePage() {
  return (
    <DashboardSectionPage
      title="Profile"
      description="Profile settings are on the roadmap — not built yet."
      icon={User}
    />
  );
}
