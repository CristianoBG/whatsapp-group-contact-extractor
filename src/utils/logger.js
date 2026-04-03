/**
 * @fileoverview Structured logger using Pino.
 * Provides consistent, leveled logging throughout the application.
 * In development, uses pino-pretty for human-readable output.
 * In production, outputs JSON for log aggregation systems (e.g., Datadog, Loki).
 */

import pino from 'pino';
import { config } from '../config/index.js';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Application-wide logger instance.
 * @type {import('pino').Logger}
 */
export const logger = pino({
  level: config.logLevel,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        levelFirst: false,
      },
    },
  }),
});

/**
 * Creates a child logger with a specific module context.
 * Usage: const log = createLogger('WhatsAppClient');
 *
 * @param {string} module - The module/component name
 * @returns {import('pino').Logger} Child logger with module context
 */
export function createLogger(module) {
  return logger.child({ module });
}
