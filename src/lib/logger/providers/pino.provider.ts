import pino from 'pino';
import { sanitizeContext } from '../sanitize';
import type { ILogger, ILoggerProvider, LogContext, LogLevel } from '../types';

declare global {
  // eslint-disable-next-line no-var
  var __pinoRoot: pino.Logger | undefined;
}

function wrapPinoLogger(instance: pino.Logger): ILogger {
  return {
    debug: (message, context) => instance.debug(sanitizeContext(context) ?? {}, message),
    info: (message, context) => instance.info(sanitizeContext(context) ?? {}, message),
    warn: (message, context) => instance.warn(sanitizeContext(context) ?? {}, message),
    error: (message, context) => {
      const { err, ...rest } = context ?? {};
      const meta = sanitizeContext(rest as LogContext) ?? {};
      if (err) instance.error({ ...meta, err }, message);
      else instance.error(meta, message);
    },
    child: (bindings) => wrapPinoLogger(instance.child(sanitizeContext(bindings) ?? {})),
  };
}

function createRootLogger(minLevel: LogLevel): pino.Logger {
  if (global.__pinoRoot) return global.__pinoRoot;

  const isDev = process.env.NODE_ENV !== 'production';
  const usePretty = isDev && process.env.LOGGER_PRETTY !== 'false';

  const root = usePretty
    ? pino({
        level: minLevel,
        base: undefined,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      })
    : pino({
        level: minLevel,
        base: undefined,
        timestamp: pino.stdTimeFunctions.isoTime,
      });

  if (process.env.NODE_ENV !== 'production') {
    global.__pinoRoot = root;
  }

  return root;
}

export function createPinoProvider(minLevel: LogLevel): ILoggerProvider {
  const root = createRootLogger(minLevel);

  return {
    create: (bindings) => wrapPinoLogger(root.child(sanitizeContext(bindings) ?? {})),
  };
}
