import { DashboardCalendarWidget } from '@/components/features/dashboard/DashboardCalendarWidget';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard | PersonalFi',
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="page-heading">Dashboard</h1>
      <div className="grid">
        <div className="grid__col--five">
          <Suspense>
            <DashboardCalendarWidget />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
