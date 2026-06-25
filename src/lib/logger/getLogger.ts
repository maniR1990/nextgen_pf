import { resolveLoggerProvider } from './providers';
import type { ILogger, LogLevel } from './types';

const loggers = new Map<string, ILogger>();
let rootProvider = resolveLoggerProvider(resolveMinLevel());

function resolveMinLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/** Reset provider — useful in tests */
export function resetLoggerRegistry() {
  loggers.clear();
  global.__pinoRoot = undefined;
  rootProvider = resolveLoggerProvider(resolveMinLevel());
}

/**
 * Get a service-scoped logger. One instance per service name (singleton per process).
 * @example getLogger('AuthService').info('user.login', { userId, action: 'login' })
 */
export function getLogger(service: string): ILogger {
  const existing = loggers.get(service);
  if (existing) return existing;

  const logger = rootProvider.create({ service });
  loggers.set(service, logger);
  return logger;
}
