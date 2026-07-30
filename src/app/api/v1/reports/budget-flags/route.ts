import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { ReportsService } from '@/modules/reports';

const handleBudgetFlags = compose(withAuth())(async (req, ctx) => {
  const userId = ctx.session!.id;
  const url = new URL(req.url);
  const now = new Date();

  const year = Number.parseInt(url.searchParams.get('year') ?? String(now.getFullYear()), 10);
  const month = Number.parseInt(url.searchParams.get('month') ?? String(now.getMonth() + 1), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12 || year < 2020) {
    return v1FromApiError({ message: 'Invalid year or month', status: 400, code: 'BAD_REQUEST' });
  }

  try {
    const result = await ReportsService.getBudgetFlags(userId, year, month);
    return v1Ok(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleBudgetFlags);
