import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedSystemCategories } from './seeds/system-categories';

const prisma = new PrismaClient();

const DEFAULT_ACCOUNT_GROUPS = [
  { name: 'Cash & Bank', slug: 'cash-bank', type: 'ASSET' as const, order: 1 },
  { name: 'Investments', slug: 'investments', type: 'ASSET' as const, order: 2 },
  { name: 'Credit Cards', slug: 'credit-cards', type: 'LIABILITY' as const, order: 3 },
  { name: 'Loans', slug: 'loans', type: 'LIABILITY' as const, order: 4 },
];

async function seedDefaultAccountGroups(userId: string) {
  for (const group of DEFAULT_ACCOUNT_GROUPS) {
    await prisma.accountGroup.upsert({
      where: { userId_slug: { userId, slug: group.slug } },
      update: {},
      create: { ...group, userId, isDefault: true },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  await seedDefaultAccountGroups(admin.id);
  await seedSystemCategories(prisma);

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
