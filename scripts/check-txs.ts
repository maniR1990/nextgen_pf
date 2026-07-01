import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mani.r16@gmail.com' } });
  const txs = await prisma.financeTransaction.findMany({
    where: { userId: user.id },
    select: { id: true, type: true, amount: true, merchant: true, accountId: true, voidedAt: true },
    orderBy: { date: 'desc' },
    take: 10,
  });
  for (const t of txs) console.log(t);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
