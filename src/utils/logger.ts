import pino from 'pino';

/**
 * Shared application logger.
 *
 * `LOG_LEVEL` can be set per environment; it defaults to `info` for local
 * development and tests.
 */
export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
