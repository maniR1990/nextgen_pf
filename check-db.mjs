import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const userId = '6a338d09648e6f2e8896b603';
const notArchived = { NOT: { archivedAt: { isSet: true, not: null } } };

const count = await prisma.fund.count({ where: { userId, ...notArchived } });
console.log('count active funds (fixed):', count);

const funds = await prisma.fund.findMany({
  where: { userId, ...notArchived },
  take: 3,
  select: { id: true, name: true, groupId: true, archivedAt: true },
});
console.log('funds (fixed):', JSON.stringify(funds));

await prisma.$disconnect();
