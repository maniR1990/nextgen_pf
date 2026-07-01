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
    where: { OR: [{ userId: user!.id }, { isSystem: true }], type: 'EXPENSE', isActive: true },
    select: { id: true, name: true, level: true, isSystem: true, parentId: true, userId: true },
    orderBy: [{ level: 'asc' }, { order: 'asc' }],
  });
  const byId = new Map(cats.map((c) => [c.id, c]));
  for (const c of cats) {
    const owner = c.isSystem ? '[SYS]' : c.userId === user!.id ? '[MANI]' : '[OTHER]';
    const parent = c.parentId ? (byId.get(c.parentId)?.name ?? '?') : '-';
    const indent = '  '.repeat(c.level);
    console.log(`${indent}L${c.level} ${owner} ${c.name} (parent: ${parent})`);
  }
}
main().finally(() => prisma.$disconnect());
