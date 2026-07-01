import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAILS_TO_DELETE = ['test.r16@gmail.com', 'test@nextgenpf.com', 'apitester@test.com'];

async function main() {
  for (const email of EMAILS_TO_DELETE) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⚠ Not found: ${email}`);
      continue;
    }

    const uid = user.id;

    // Delete in dependency order (children before parents)
    const [txDel] = await Promise.all([
      prisma.financeTransaction.deleteMany({ where: { userId: uid } }),
    ]);

    await Promise.all([
      prisma.budget.deleteMany({ where: { userId: uid } }),
      prisma.budgetOverride.deleteMany({ where: { userId: uid } }),
      prisma.recurringTemplate.deleteMany({ where: { userId: uid } }),
      prisma.merchantAlias.deleteMany({ where: { userId: uid } }),
      prisma.refreshToken.deleteMany({ where: { userId: uid } }),
      // revokedAccessToken has no userId — skip, JTIs expire naturally
      prisma.passwordResetToken.deleteMany({ where: { userId: uid } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: uid } }),
      prisma.oAuthAccount.deleteMany({ where: { userId: uid } }),
    ]);

    // Delete categories leaf→parent to satisfy self-referential FK
    await prisma.category.deleteMany({ where: { userId: uid, level: 2 } });
    await prisma.category.deleteMany({ where: { userId: uid, level: 1 } });
    await prisma.category.deleteMany({ where: { userId: uid, level: 0 } });

    await Promise.all([
      prisma.fund.deleteMany({ where: { userId: uid } }),
      prisma.fundGroup.deleteMany({ where: { userId: uid } }),
      prisma.event.deleteMany({ where: { userId: uid } }),
    ]);

    await Promise.all([prisma.account.deleteMany({ where: { userId: uid } })]);

    await Promise.all([prisma.accountGroup.deleteMany({ where: { userId: uid } })]);

    await prisma.user.delete({ where: { id: uid } });

    console.log(`✓ Deleted ${email} — ${txDel.count} transactions removed`);
  }

  const remaining = await prisma.user.count();
  console.log(`\nDone. ${remaining} user(s) remaining.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
