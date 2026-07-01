import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Nagarro ₹2,34,707 + quarterly interest ₹7,583
  const balance = 234707 + 7583; // ₹2,42,290
  const HDFC_ID = '6a448deddabb3478c4ac24d5';

  await prisma.account.update({
    where: { id: HDFC_ID },
    data: { balance, balanceAsOf: new Date() },
  });
  console.log(`✓ HDFC BANK balance set to ₹${balance.toLocaleString('en-IN')}`);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
