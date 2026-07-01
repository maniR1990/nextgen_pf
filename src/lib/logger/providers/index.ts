import type { ILoggerProvider, LogLevel } from '../types';
import { createConsoleProvider } from './console.provider';
import { createJsonProvider } from './json.provider';
import { createPinoProvider } from './pino.provider';

export type LoggerProviderName = 'pino' | 'console' | 'json';

export function resolveLoggerProvider(minLevel: LogLevel): ILoggerProvider {
  const name = (process.env.LOGGER_PROVIDER ?? defaultProvider()) as LoggerProviderName;

  switch (name) {
    case 'console':
      return createConsoleProvider(minLevel);
    case 'json':
      return createJsonProvider(minLevel);
    default:
      return createPinoProvider(minLevel);
  }
}

function defaultProvider(): LoggerProviderName {
  return 'pino';
}
