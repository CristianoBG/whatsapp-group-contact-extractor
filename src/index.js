/**
 * @fileoverview Main entry point for the WhatsApp Group Contact Extractor.
 * Orchestrates the application lifecycle, from authentication to export.
 *
 * Senior Engineering Principles:
 *  - Graceful shutdown handlers
 *  - Global error trapping
 *  - Inversion of Control via service injection
 *  - CLI User Experience (interactive prompts)
 */

import { WhatsAppClient } from './bot/WhatsAppClient.js';
import { GroupExtractor } from './bot/GroupExtractor.js';
import { ExportService } from './services/ExportService.js';
import { SessionService } from './services/SessionService.js';
import { createLogger } from './utils/logger.js';
import {
  promptGroupSelection,
  promptExportFormat,
  promptContinue,
  promptConfirm,
} from './utils/promptHelper.js';

const log = createLogger('Main');

class App {
  constructor() {
    this.client = new WhatsAppClient();
    this.exportService = new ExportService();
    this.sessionService = new SessionService();
  }

  /**
   * Initializes and runs the main loop of the application.
   */
  async run() {
    try {
      console.log('\n🚀 Starting WhatsApp Contact Extractor v2.0.0...\n');

      // ───────────────────────────────────────────────────────────────────────
      // 1. Connection Lifecycle
      // ───────────────────────────────────────────────────────────────────────
      await this.client.connect();
      
      console.log('🔄 Sincronizando dados iniciais...');
      // A bit more time for the initial "history storm" to pass
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log('✅ Tudo pronto! O menu aparecerá abaixo.\n');
      const extractor = new GroupExtractor(this.client.getSocket());

      // ───────────────────────────────────────────────────────────────────────
      // 2. Main Extraction Loop
      // ───────────────────────────────────────────────────────────────────────
      let isRunning = true;

      while (isRunning) {
        const groups = await extractor.listGroups();

        if (groups.length === 0) {
          log.warn('No WhatsApp groups found. Make sure you are a member of at least one group.');
          break;
        }

        const selectedGroupId = await promptGroupSelection(groups);
        const selectedGroup = groups.find((g) => g.id === selectedGroupId);

        log.info({ group: selectedGroup.name }, 'Selected group for extraction.');

        const contacts = await extractor.extractContacts(selectedGroupId);

        if (contacts.length === 0) {
          log.warn('The selected group has no participants to extract.');
        } else {
          const format = await promptExportFormat();
          const results = await this.exportService.export(selectedGroup.name, contacts, format);

          console.log('\n✅ Extraction successful!');
          if (results.csv) console.log(`   📄 CSV: ${results.csv}`);
          if (results.json) console.log(`   📦 JSON: ${results.json}`);
          console.log('\n');
        }

        isRunning = await promptContinue();
      }

      console.log('\n👋 Thank you for using the WhatsApp Contact Extractor!');
      process.exit(0);

    } catch (err) {
      this.#handleGlobalError(err);
    }
  }

  /**
   * Handles unexpected errors by logging and attempting to clean up.
   * @param {Error} err
   */
  async #handleGlobalError(err) {
    log.fatal({
      msg: err.message,
      stack: err.stack,
    }, '❌ Fatal application error occurred');

    if (err.message.includes('logged out')) {
      const reset = await promptConfirm('Would you like to clear the current session and start over?');
      if (reset) {
        await this.sessionService.clearSession();
        console.log('Session cleared. Please restart the app to scan the QR code.');
      }
    }

    process.exit(1);
  }

  /**
   * Gracefully closes connections on process termination.
   */
  setupSignalHandlers() {
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, async () => {
        log.info({ signal }, 'Termination signal received. Shutting down...');
        if (this.client.isConnected) {
          await this.client.disconnect();
        }
        process.exit(0);
      });
    });
  }
}

// ── Application Boot ────────────────────────────────────────────────────────
const app = new App();
app.setupSignalHandlers();
app.run();
