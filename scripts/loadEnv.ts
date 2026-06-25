import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Load `.env.local` then `.env` (same order as Next.js). */
export function loadEnvFiles(cwd = process.cwd()) {
  for (const name of ['.env.local', '.env']) {
    const path = join(cwd, name);
    if (!existsSync(path)) continue;

    const content = readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
