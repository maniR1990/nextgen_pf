import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mani.r16@gmail.com' } });
  const accs = await prisma.account.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, balance: true },
  });
  for (const a of accs) console.log(a);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
