import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MANI_ID = '6a446d56dabb3478c4ac24c2';

async function main() {
  // Direct string filter
  const r1 = await prisma.financeTransaction.findMany({
    where: { userId: MANI_ID },
    select: { id: true },
  });
  console.log('findMany userId hardcoded:', r1.length);

  // Via user lookup
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mani.r16@gmail.com' } });
  console.log('user.id:', user.id, typeof user.id);
  const r2 = await prisma.financeTransaction.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  console.log('findMany userId from user:', r2.length);

  // Are the strings equal?
  console.log('IDs equal?', user.id === MANI_ID);
  console.log('Buffer check:', Buffer.isBuffer(user.id));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
