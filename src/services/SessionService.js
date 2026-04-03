/**
 * @fileoverview Service for managing the WhatsApp session lifecycle.
 * Handles checking for existing sessions and clearing session state.
 */

import fs from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const log = createLogger('SessionService');

export class SessionService {
  /**
   * Checks if an authentication session already exists on disk.
   *
   * @returns {Promise<boolean>} True if session data is found
   */
  async hasSession() {
    try {
      const stats = await fs.stat(config.sessionDir);
      if (!stats.isDirectory()) return false;

      const files = await fs.readdir(config.sessionDir);
      // creds.json is the main marker for a Baileys session
      return files.includes('creds.json');
    } catch {
      return false;
    }
  }

  /**
   * Clears the current session data.
   * Use this to force a re-authentication (new QR code).
   *
   * @returns {Promise<void>}
   */
  async clearSession() {
    log.info('Clearing session data...');
    try {
      await fs.rm(config.sessionDir, { recursive: true, force: true });
      // Re-create the empty directory
      await fs.mkdir(config.sessionDir, { recursive: true });
      log.info('✅ Session cleared successfully.');
    } catch (err) {
      log.error({ err: err.message }, 'Failed to clear session data.');
      throw new Error(`Session cleanup failed: ${err.message}`);
    }
  }
}
