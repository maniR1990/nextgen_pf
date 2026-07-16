import { DashboardCalendarWidget } from '@/components/features/dashboard/DashboardCalendarWidget';
import { SubscriptionAuditWidget } from '@/components/features/dashboard/SubscriptionAuditWidget';
import { PriceCreepDetector } from '@/components/features/dashboard/PriceCreepDetector';
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
        <div className="grid__col--five">
          <Suspense>
            <SubscriptionAuditWidget />
          </Suspense>
        </div>
        <div className="grid__col--five">
          <Suspense>
            <PriceCreepDetector />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
