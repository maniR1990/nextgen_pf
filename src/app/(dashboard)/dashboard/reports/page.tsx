import { Suspense } from 'react';
import type { SearchParams } from 'next/dist/server/request/search-params';
import { ReportKpiBar, ReportKpiBarSkeleton } from '@/components/reports/ReportKpiBar';

interface ReportsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const now    = new Date();
  const year   = Number(params['year']  ?? now.getFullYear());
  const month  = Number(params['month'] ?? (now.getMonth() + 1));

  return (
    <div className="tx-page__content">
      <Suspense fallback={<ReportKpiBarSkeleton />}>
        <ReportKpiBar year={year} month={month} />
      </Suspense>
    </div>
  );
}
