import { FLAGS, isEnabled } from '@/lib/flags';

type RouteParams = { params: Promise<{ key: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { key } = await params;
  const flagEntry = Object.entries(FLAGS).find(([, v]) => v.key === key);

  if (!flagEntry) {
    return Response.json({ success: false, error: 'Flag not found' }, { status: 404 });
  }

  const [flagKey] = flagEntry;
  const enabled = await isEnabled(flagKey as keyof typeof FLAGS);
  return Response.json({ success: true, enabled });
}
