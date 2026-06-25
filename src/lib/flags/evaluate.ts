import { prisma } from '@/lib/db/prisma';
import { FLAGS, type FlagKey } from './flags';

interface FlagContext {
  userId?: string;
  role?: string;
}

export async function isEnabled(flag: FlagKey, context?: FlagContext): Promise<boolean> {
  const { key, defaultValue } = FLAGS[flag];
  const envKey = `FLAG_${key.toUpperCase().replace(/-/g, '_')}`;

  if (process.env[envKey] === 'true') return true;

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

  return record?.enabled ?? defaultValue;
}
