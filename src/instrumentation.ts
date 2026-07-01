export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { connectDatabase } = await import('@/lib/db/connectDatabase');
  await connectDatabase();
  console.log('[db] MongoDB connected');

  // C3 + H2: Fail fast in production if placeholder secrets are still set.
  // A server running with default secrets is a critical vulnerability.
  if (process.env.NODE_ENV === 'production') {
    const WEAK = new Set([
      'dev-access-secret',
      'dev-refresh-secret',
      'change-me-in-production',
      'change-me-access-secret',
      'change-me-refresh-secret',
      '',
    ]);

    const checks: Array<[string, string, number]> = [
      ['JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET ?? '', 32],
      ['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET ?? '', 32],
      ['NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET ?? '', 32],
      ['CRON_SECRET', process.env.CRON_SECRET ?? '', 16],
    ];

    for (const [name, value, minLen] of checks) {
      if (WEAK.has(value) || value.length < minLen) {
        throw new Error(
          `[startup] ${name} is missing or too weak — set a strong secret before deploying`,
        );
      }
    }

    console.log('[startup] Secret validation passed');
  }
}
