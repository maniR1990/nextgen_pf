import { asRouteHandler, withCronSecret } from '@/lib/api/middleware';
import { CleanupJob } from '@/jobs/schedulers/cleanup.job';

export const POST = asRouteHandler(
  withCronSecret(async () => {
    await CleanupJob.run();
    return Response.json({ ok: true });
  }),
);
