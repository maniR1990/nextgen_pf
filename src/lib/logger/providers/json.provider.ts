import { sanitizeContext } from '../sanitize';
import {
  type ILogger,
  type ILoggerProvider,
  LOG_LEVELS,
  type LogContext,
  type LogLevel,
} from '../types';

function shouldLog(level: LogLevel, minLevel: LogLevel) {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function write(level: LogLevel, message: string, bindings: LogContext, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizeContext({ ...bindings, ...context }),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function createJsonLogger(bindings: LogContext, minLevel: LogLevel): ILogger {
  return {
    debug: (m, c) => shouldLog('debug', minLevel) && write('debug', m, bindings, c),
    info: (m, c) => shouldLog('info', minLevel) && write('info', m, bindings, c),
    warn: (m, c) => shouldLog('warn', minLevel) && write('warn', m, bindings, c),
    error: (m, c) => shouldLog('error', minLevel) && write('error', m, bindings, c),
    child: (childBindings) => createJsonLogger({ ...bindings, ...childBindings }, minLevel),
  };
}

export function createJsonProvider(minLevel: LogLevel): ILoggerProvider {
  return {
    create: (bindings) => createJsonLogger(bindings, minLevel),
  };
}
