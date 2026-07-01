import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check who owns the Nagarro transaction
  const tx = await prisma.financeTransaction.findUnique({
    where: { id: '6a44907ddabb3478c4ac24db' },
    select: { userId: true, accountId: true, type: true, amount: true, merchant: true },
  });
  console.log('Nagarro tx:', tx);

  // Check all users
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log('\nAll users:', users);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
