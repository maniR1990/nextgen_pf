import { execSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { createConnection } from 'node:net';
import { connectDatabase } from '../src/lib/db/connectDatabase';
import { loadEnvFiles } from './loadEnv';

loadEnvFiles();

const MONGO_HOST = '127.0.0.1';
const MONGO_PORT = 27017;
const REPLICA_SET = 'rs0';
const MONGO_DBPATH = process.env.MONGO_DBPATH ?? 'C:\\data\\db';

// ─── MongoDB process detection ───────────────────────────────────────────────

function findMongod(): string | null {
  if (process.env.MONGOD_PATH) {
    if (existsSync(process.env.MONGOD_PATH)) return process.env.MONGOD_PATH;
    console.warn(`⚠ MONGOD_PATH env var set but file not found: ${process.env.MONGOD_PATH}`);
  }

  const fromPath = spawnSync('where', ['mongod'], { encoding: 'utf8' });
  if (fromPath.status === 0 && fromPath.stdout) {
    const first = fromPath.stdout.trim().split(/\r?\n/)[0];
    if (first && existsSync(first)) return first;
  }

  for (const ver of ['8.3', '8.0', '7.0', '6.0']) {
    const p = `C:\\Program Files\\MongoDB\\Server\\${ver}\\bin\\mongod.exe`;
    if (existsSync(p)) return p;
  }

  return null;
}

function findMongosh(): string | null {
  if (process.env.MONGOSH_PATH) {
    if (existsSync(process.env.MONGOSH_PATH)) return process.env.MONGOSH_PATH;
    console.warn(`⚠ MONGOSH_PATH env var set but file not found: ${process.env.MONGOSH_PATH}`);
  }

  const fromPath = spawnSync('where', ['mongosh'], { encoding: 'utf8' });
  if (fromPath.status === 0 && fromPath.stdout) {
    const first = fromPath.stdout.trim().split(/\r?\n/)[0];
    if (first && existsSync(first)) return first;
  }

  const user = process.env.USERPROFILE ?? 'C:\\Users\\rjman';
  const candidates = [
    `${user}\\AppData\\Local\\Programs\\mongosh\\mongosh.exe`,
    'C:\\Program Files\\mongosh\\bin\\mongosh.exe',
    'C:\\Program Files\\MongoDB\\Shell\\bin\\mongosh.exe',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  return null;
}

// ─── Replica set health check ─────────────────────────────────────────────────

async function isMongodRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: MONGO_HOST, port: MONGO_PORT });
    const finish = (ok: boolean) => { socket.destroy(); resolve(ok); };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(1000, () => finish(false));
  });
}

async function waitForMongod(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isMongodRunning()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('MongoDB did not become ready within 30 seconds');
}

function tryInitReplicaSet(mongoshPath: string): void {
  // rs.status() throws when not initialized; rs.initiate() is a no-op if already done (code 23)
  const script = `
    try {
      rs.status();
    } catch (e) {
      if (e.codeName === 'NotYetInitialized') {
        rs.initiate({_id:'${REPLICA_SET}',members:[{_id:0,host:'${MONGO_HOST}:${MONGO_PORT}'}]});
      }
    }
  `.replace(/\s+/g, ' ');

  const result = spawnSync(
    mongoshPath,
    ['--quiet', '--eval', script, `mongodb://${MONGO_HOST}:${MONGO_PORT}`],
    { encoding: 'utf8', timeout: 15_000 },
  );

  if (result.status !== 0) {
    console.warn('⚠ Could not auto-initialize replica set:', result.stderr?.trim());
  }
}

// ─── Main startup logic ───────────────────────────────────────────────────────

async function ensureMongodRunning(): Promise<void> {
  const alreadyUp = await isMongodRunning();

  if (!alreadyUp) {
    const mongodPath = findMongod();
    if (!mongodPath) {
      throw new Error(
        'MongoDB (mongod) not found. Install MongoDB or set MONGOD_PATH to its full path.',
      );
    }

    if (!existsSync(MONGO_DBPATH)) {
      console.log(`→ Creating data directory: ${MONGO_DBPATH}`);
      mkdirSync(MONGO_DBPATH, { recursive: true });
    }

    console.log(`→ Starting MongoDB (replica set "${REPLICA_SET}")…`);
    spawn(
      mongodPath,
      ['--dbpath', MONGO_DBPATH, '--replSet', REPLICA_SET, '--bind_ip', MONGO_HOST],
      { detached: true, stdio: 'ignore', windowsHide: true },
    ).unref();

    await waitForMongod();
    console.log('✓ MongoDB started');

    // Initialize replica set on first run (no-op if data dir already has rs state)
    const mongoshPath = findMongosh();
    if (mongoshPath) {
      tryInitReplicaSet(mongoshPath);
    } else {
      console.log(
        '  ℹ mongosh not found — if this is a fresh data directory, run once:\n' +
          `  mongosh --eval "rs.initiate({_id:'${REPLICA_SET}',members:[{_id:0,host:'${MONGO_HOST}:${MONGO_PORT}'}]})"`,
      );
    }
  } else {
    console.log('✓ MongoDB already running');
  }
}

// ─── Prisma steps ─────────────────────────────────────────────────────────────

function shouldSyncSchema(): boolean {
  if (process.env.DB_SYNC_ON_START === 'false') return false;
  if (process.env.DB_SYNC_ON_START === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

function syncSchema(): void {
  console.log('→ Syncing Prisma schema to MongoDB (db push)…');
  execSync('pnpm exec prisma db push --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });
}

function generateClient(): void {
  console.log('→ Generating Prisma client…');
  try {
    execSync('pnpm exec prisma generate', {
      stdio: ['ignore', 'inherit', 'pipe'],
      env: process.env,
    });
  } catch (err: unknown) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? '';
    if (stderr.includes('EPERM') || stderr.includes('operation not permitted')) {
      // DLL is locked by a running Next.js process — it's already loaded and valid
      console.log('✓ Prisma engine already in use; skipping overwrite');
      return;
    }
    if (stderr) process.stderr.write(stderr);
    throw err;
  }
}

async function disconnect() {
  const { prisma } = await import('../src/lib/db/prisma');
  await prisma.$disconnect();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  await ensureMongodRunning();

  generateClient();

  if (shouldSyncSchema()) {
    syncSchema();
  }

  await connectDatabase();
  console.log('✓ Database ready');
  await disconnect();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  const isReplicaSetError =
    error instanceof Error && error.message.includes('replica set');
  if (isReplicaSetError) {
    console.error(`✗ ${message}`);
    console.error(
      '\nMongoDB must run as a replica set. Run this once in mongosh:\n' +
        `  rs.initiate({_id:'${REPLICA_SET}',members:[{_id:0,host:'${MONGO_HOST}:${MONGO_PORT}'}]})\n` +
        `\nOr set MONGOSH_PATH env var so ensure-db.ts can do it automatically.`,
    );
  } else {
    console.error(`✗ Database setup failed: ${message}`);
  }
  process.exit(1);
});
