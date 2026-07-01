import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.financeTransaction.count();
  console.log('Total transactions in DB:', count);

  const all = await prisma.financeTransaction.findMany({
    take: 5,
    select: { id: true, type: true, amount: true, merchant: true, accountId: true },
  });
  console.log('Sample:', all);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
