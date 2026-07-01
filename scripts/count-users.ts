import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, emailVerified: true, createdAt: true },
  });
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(
      u.role.padEnd(6),
      u.email,
      '|',
      u.name,
      '| verified:',
      !!u.emailVerified,
      '| joined:',
      u.createdAt.toISOString().slice(0, 10),
    );
  }
}

main().finally(() => prisma.$disconnect());
