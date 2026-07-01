import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({ select: { id: true, name: true }, take: 2 });
  for (const acc of accounts) {
    console.log(
      `name=${acc.name} id type=${typeof acc.id} val=${JSON.stringify(acc.id)} repr=${acc.id}`,
    );
    const txs = await prisma.financeTransaction.findMany({
      where: { accountId: acc.id },
      select: { id: true },
      take: 3,
    });
    console.log(`  txs found: ${txs.length}`);
    // Try with string coercion
    const txs2 = await prisma.financeTransaction.findMany({
      where: { accountId: String(acc.id) },
      select: { id: true },
      take: 3,
    });
    console.log(`  txs (String()): ${txs2.length}`);
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
