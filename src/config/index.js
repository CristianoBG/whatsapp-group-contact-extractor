/**
 * @fileoverview Centralized application configuration.
 * All configuration values are sourced from environment variables,
 * with sensible defaults for development.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

/**
 * Validates that a required environment variable is set.
 * @param {string} name - The environment variable name
 * @returns {string} The value of the environment variable
 * @throws {Error} If the variable is not set
 */
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${name}\n` +
      `  → Copy .env.example to .env and fill in the required values.`
    );
  }
  return value;
}

/**
 * Resolves a directory path and ensures it exists.
 * @param {string} relativePath - Relative path from project root
 * @returns {string} Absolute path
 */
function resolveDir(relativePath) {
  const absolute = path.resolve(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

const VALID_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const VALID_EXPORT_FORMATS = ['csv', 'json', 'both'];

const rawLogLevel = process.env.LOG_LEVEL ?? 'info';
const rawExportFormat = process.env.EXPORT_FORMAT ?? 'csv';
const rawConcurrency = parseInt(process.env.CONCURRENCY_LIMIT ?? '5', 10);

if (!VALID_LOG_LEVELS.includes(rawLogLevel)) {
  throw new Error(`[Config] Invalid LOG_LEVEL: "${rawLogLevel}". Must be one of: ${VALID_LOG_LEVELS.join(', ')}`);
}

if (!VALID_EXPORT_FORMATS.includes(rawExportFormat)) {
  throw new Error(`[Config] Invalid EXPORT_FORMAT: "${rawExportFormat}". Must be one of: ${VALID_EXPORT_FORMATS.join(', ')}`);
}

if (isNaN(rawConcurrency) || rawConcurrency < 1 || rawConcurrency > 20) {
  throw new Error(`[Config] CONCURRENCY_LIMIT must be a number between 1 and 20.`);
}

/**
 * Application configuration object.
 * @type {object}
 */
export const config = Object.freeze({
  /** Logging level */
  logLevel: rawLogLevel,

  /** Absolute path for output files (CSV/JSON) */
  outputDir: resolveDir(process.env.OUTPUT_DIR ?? './output'),

  /** Absolute path for Baileys session storage */
  sessionDir: resolveDir(process.env.SESSION_DIR ?? './session'),

  /** Export format: csv | json | both */
  exportFormat: rawExportFormat,

  /** Max parallel requests when fetching group metadata */
  concurrencyLimit: rawConcurrency,

  /** Optional substring to filter group names */
  groupFilter: process.env.GROUP_FILTER ?? '',

  /** Whether we're running inside Docker */
  isDocker: process.env.RUNNING_IN_DOCKER === 'true',
});
