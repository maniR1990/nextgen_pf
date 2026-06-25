import { LOG_LEVELS, type ILogger, type ILoggerProvider, type LogContext, type LogLevel } from '../types';
import { sanitizeContext } from '../sanitize';

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

function shouldLog(level: LogLevel, minLevel: LogLevel) {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function createConsoleLogger(bindings: LogContext, minLevel: LogLevel): ILogger {
  const log = (level: LogLevel, message: string, context?: LogContext) => {
    if (!shouldLog(level, minLevel)) return;
    const prefix = bindings.service ? `[${bindings.service}]` : '';
    const meta = sanitizeContext({ ...bindings, ...context });
    const color = LEVEL_COLORS[level];
    const reset = '\x1b[0m';
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const line = `${color}${level.toUpperCase()}${reset} ${prefix} ${message}${metaStr}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    debug: (m, c) => log('debug', m, c),
    info: (m, c) => log('info', m, c),
    warn: (m, c) => log('warn', m, c),
    error: (m, c) => log('error', m, c),
    child: (childBindings) => createConsoleLogger({ ...bindings, ...childBindings }, minLevel),
  };
}

export function createConsoleProvider(minLevel: LogLevel): ILoggerProvider {
  return {
    create: (bindings) => createConsoleLogger(bindings, minLevel),
  };
}
