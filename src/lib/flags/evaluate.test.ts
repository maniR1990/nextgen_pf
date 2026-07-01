import { prisma } from '@/lib/db/prisma';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEnabled } from './evaluate';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { featureFlag: { findFirst: vi.fn() } },
}));

describe('isEnabled', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when env override is set', async () => {
    process.env.FLAG_NEW_DASHBOARD = 'true';
    expect(await isEnabled('NEW_DASHBOARD')).toBe(true);
    process.env.FLAG_NEW_DASHBOARD = undefined;
  });

  it('returns default when flag not in DB', async () => {
    vi.mocked(prisma.featureFlag.findFirst).mockResolvedValue(null);
    expect(await isEnabled('AI_INSIGHTS')).toBe(false);
  });

  it('returns true for user-targeted flag', async () => {
    vi.mocked(prisma.featureFlag.findFirst).mockResolvedValue({
      id: '1',
      key: 'beta-transactions',
      enabled: true,
      userId: 'beta-user-1',
      role: null,
    });
    expect(await isEnabled('BETA_TRANSACTIONS', { userId: 'beta-user-1' })).toBe(true);
  });
});
