import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.financeTransaction.findMany({
    where: { accountId: '6a448deddabb3478c4ac24d5' },
    select: { id: true, type: true, amount: true, voidedAt: true },
  });
  console.log('HDFC txs:', txs);
  // Also try without voidedAt filter
  const all = await prisma.financeTransaction.findMany({
    select: { id: true, type: true, amount: true, accountId: true, voidedAt: true },
    orderBy: { date: 'desc' },
    take: 3,
  });
  console.log('Latest 3:', all);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
