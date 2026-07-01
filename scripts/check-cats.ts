import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'mani.r16@gmail.com' },
    select: { id: true },
  });
  const cats = await prisma.category.findMany({
    where: { level: 1, type: 'EXPENSE' },
    select: { id: true, name: true, isSystem: true, userId: true },
    orderBy: { order: 'asc' },
  });
  for (const c of cats) {
    const tag = c.isSystem ? '[SYS]' : c.userId === user!.id ? '[MANI]' : '[OTHER]';
    console.log(tag, c.name, c.id);
  }
}
main().finally(() => prisma.$disconnect());
