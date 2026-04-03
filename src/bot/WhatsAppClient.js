/**
 * @fileoverview WhatsApp client wrapper around the Baileys library.
 *
 * Responsibilities:
 *  - Manage authentication state (persistent session via filesystem)
 *  - Handle QR code generation and display
 *  - Emit connection lifecycle events
 *  - Provide a clean async API for the rest of the application
 *
 * Design Pattern: Facade — simplifies the complex Baileys API
 * into a focused interface for our use case.
 */

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const log = createLogger('WhatsAppClient');

/**
 * @typedef {Object} ConnectionState
 * @property {'connecting' | 'open' | 'close'} connection
 * @property {Error | null} lastDisconnect
 */

/**
 * WhatsApp client that manages the Baileys connection lifecycle.
 * Implements a promise-based connection flow for clean async/await usage.
 */
export class WhatsAppClient {
  /** @type {import('@whiskeysockets/baileys').WASocket | null} */
  #socket = null;

  /** @type {boolean} */
  #isConnected = false;

  /**
   * Initializes and connects the WhatsApp socket.
   * Displays a QR code in the terminal for the first-time authentication.
   * Uses persistent session files to avoid re-scanning on subsequent runs.
   *
   * @returns {Promise<void>} Resolves when fully connected and ready
   * @throws {Error} If the connection fails after retries
   */
  async connect() {
    log.info('Initializing WhatsApp connection...');

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    log.info({ version: version.join('.'), isLatest }, 'Using Baileys version');

    return new Promise((resolve, reject) => {
      // Truly silent logger for internal library use
      const noop = () => {};
      const silentLogger = { 
        info: noop, debug: noop, warn: noop, error: noop, trace: noop, 
        child: () => silentLogger 
      };

      this.#socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        logger: silentLogger,
        printQRInTerminal: false,
        syncFullHistory: false,
        browser: ['Contact Extractor', 'CLI', '2.0.0'],
        markOnlineOnConnect: false,
      });

      // ── Connection Handler ────────────────────────────────────────────────
      this.#socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n');
          console.log('  ┌─────────────────────────────────────────┐');
          console.log('  │  Scan the QR code with WhatsApp to      │');
          console.log('  │  link your account. It expires in 60s.  │');
          console.log('  └─────────────────────────────────────────┘\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const statusCode = /** @type {Boom} */ (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          log.warn({ statusCode, reason: lastDisconnect?.error?.message }, 'Connection closed');

          if (shouldReconnect) {
            log.info('Reconnecting...');
            this.connect().then(resolve).catch(reject);
          } else {
            log.error('Logged out from WhatsApp. Clear session and re-scan.');
            reject(new Error('WhatsApp session has been logged out.'));
          }
        }

        if (connection === 'open') {
          this.#isConnected = true;
          const user = this.#socket.user;
          log.info({ jid: user?.id, name: user?.name }, '✅ Connected successfully!');
          resolve();
        }
      });

      // ── Credentials persistence ───────────────────────────────────────────
      this.#socket.ev.on('creds.update', saveCreds);
    });
  }

  /**
   * Gracefully closes the WhatsApp connection without unpairing the device.
   * @returns {void}
   */
  disconnect() {
    if (this.#socket) {
      this.#socket.end(undefined);
      this.#isConnected = false;
      log.info('Disconnected from WhatsApp (Session preserved).');
    }
  }

  /**
   * Returns the underlying Baileys socket for advanced operations.
   * Throws if called before connecting.
   *
   * @returns {import('@whiskeysockets/baileys').WASocket}
   * @throws {Error} If not yet connected
   */
  getSocket() {
    if (!this.#socket || !this.#isConnected) {
      throw new Error('WhatsApp client is not connected. Call connect() first.');
    }
    return this.#socket;
  }

  /**
   * @returns {boolean} Whether the client is currently connected
   */
  get isConnected() {
    return this.#isConnected;
  }
}
