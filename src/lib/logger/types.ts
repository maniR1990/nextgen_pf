export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  action?: string;
  durationMs?: number;
  status?: number;
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext & { err?: unknown }): void;
  child(bindings: LogContext): ILogger;
}

export interface ILoggerProvider {
  create(bindings: LogContext): ILogger;
}
