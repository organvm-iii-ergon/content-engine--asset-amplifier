import pino from 'pino';

export type Logger = pino.Logger;

export function createLogger(name: string, level?: string): Logger {
  return pino({
    name,
    level: level ?? process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
        : undefined,
    serializers: pino.stdSerializers,
    base: { service: name, pid: process.pid },
  });
}

export const logger = createLogger('cronus');
