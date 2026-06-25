import { FLAGS, type FlagKey } from '../flags';

export function evaluateEnvFlag(flag: FlagKey): boolean | undefined {
  const { key } = FLAGS[flag];
  const envKey = `FLAG_${key.toUpperCase().replace(/-/g, '_')}`;
  const value = process.env[envKey];
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
