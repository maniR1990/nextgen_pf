import { loadEnvFiles } from './loadEnv';

loadEnvFiles();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Show raw MongoDB document structure
  const raw = (await prisma.$runCommandRaw({
    find: 'Account',
    filter: {},
    projection: { _id: 1, userId: 1, groupId: 1, archivedAt: 1, status: 1 },
  })) as { cursor: { firstBatch: Array<Record<string, unknown>> } };

  const docs = raw.cursor?.firstBatch ?? [];
  console.log(`Accounts in DB: ${docs.length}`);
  for (const doc of docs) {
    console.log(JSON.stringify(doc, null, 2));
  }

  // Fix: set archivedAt: null on accounts where the field is missing
  // Prisma's filter `{ archivedAt: null }` uses $expr which requires the field to
  // EXIST with value null — documents missing the field entirely are excluded.
  const r1 = (await prisma.$runCommandRaw({
    update: 'Account',
    updates: [
      {
        q: { archivedAt: { $exists: false } },
        u: [{ $set: { archivedAt: null } }],
        multi: true,
      },
    ],
  })) as { n?: number; nModified?: number };
  console.log(`\nFixed archivedAt (missing → null): ${r1.nModified ?? r1.n ?? 0} documents`);

  // Also fix status if missing (default ACTIVE)
  const r2 = (await prisma.$runCommandRaw({
    update: 'Account',
    updates: [
      {
        q: { status: { $exists: false } },
        u: [{ $set: { status: 'ACTIVE' } }],
        multi: true,
      },
    ],
  })) as { n?: number; nModified?: number };
  console.log(`Fixed status (missing → ACTIVE): ${r2.nModified ?? r2.n ?? 0} documents`);

  console.log('\nDone. Restart dev server and reload Settings → Accounts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
