import { prisma } from '@/lib/db/prisma';
import { FLAGS, type FlagKey } from '../flags';

export async function evaluateDbFlag(
  flag: FlagKey,
  context?: { userId?: string; role?: string },
): Promise<boolean | undefined> {
  const { key } = FLAGS[flag];
  const record = await prisma.featureFlag.findFirst({
    where: {
      key,
      OR: [
        ...(context?.userId ? [{ userId: context.userId }] : []),
        ...(context?.role ? [{ role: context.role as 'USER' | 'ADMIN' }] : []),
        { userId: null, role: null },
      ],
    },
  });
  return record?.enabled;
}
