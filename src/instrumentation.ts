export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { connectDatabase } = await import('@/lib/db/connectDatabase');
  await connectDatabase();
  console.log('[db] MongoDB connected');
}
