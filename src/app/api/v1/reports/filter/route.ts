import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { ReportFilterQuerySchema, ReportsService } from '@/modules/reports';

const handleReportFilter = compose(withAuth())(async (req, ctx) => {
  const userId = ctx.session!.id;
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());

  const parsed = ReportFilterQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return v1FromApiError({ message: 'Invalid filters', status: 400, code: 'BAD_REQUEST' });
  }

  try {
    const result = await ReportsService.getFilteredReport(userId, parsed.data);
    return v1Ok(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleReportFilter);
