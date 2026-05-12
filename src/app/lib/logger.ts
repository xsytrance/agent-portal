'use server';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

function getMinLevel(): number {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LOG_LEVELS) return LOG_LEVELS[configured];
  return process.env.NODE_ENV === 'production' ? 1 : 0;
}

export async function log(
  level: LogLevel,
  source: string,
  message: string,
  meta?: { route?: string; eventType?: string; details?: Record<string, unknown> }
): Promise<void> {
  if (LOG_LEVELS[level] < getMinLevel()) return;
  const ts = new Date().toISOString();
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
  logFn(`[${ts}] [${level.toUpperCase()}] [${source}] ${message}`,
    meta?.route ? `route=${meta.route}` : '',
    meta?.eventType ? `type=${meta.eventType}` : '',
    meta?.details ? JSON.stringify(meta.details) : ''
  );
}

export async function info(source: string, message: string, meta?: Parameters<typeof log>[3]) { return log('info', source, message, meta); }
export async function warn(source: string, message: string, meta?: Parameters<typeof log>[3]) { return log('warn', source, message, meta); }
export async function error(source: string, message: string, meta?: Parameters<typeof log>[3]) { return log('error', source, message, meta); }
export async function debug(source: string, message: string, meta?: Parameters<typeof log>[3]) { return log('debug', source, message, meta); }
