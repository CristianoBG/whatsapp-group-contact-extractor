/**
 * @fileoverview Service for exporting contact data to persistent storage.
 * Supports CSV and JSON formats with atomic-like write principles.
 *
 * Design Pattern: Service — encapsulates data persistence logic.
 */

import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const log = createLogger('ExportService');

export class ExportService {
  /**
   * Exports a list of contacts to the configured formats.
   *
   * @param {string} groupName - The name of the WhatsApp group (used for filename)
   * @param {import('../bot/GroupExtractor.js').Contact[]} contacts - List of contacts to export
   * @param {'csv' | 'json' | 'both'} [format] - Override the default export format
   * @returns {Promise<{csv?: string, json?: string}>} Paths to the generated files
   */
  async export(groupName, contacts, format = config.exportFormat) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const baseFilename = `contacts_${safeName}_${timestamp}`;

    const results = {};

    if (format === 'csv' || format === 'both') {
      results.csv = await this.#exportToCsv(baseFilename, contacts);
    }

    if (format === 'json' || format === 'both') {
      results.json = await this.#exportToJson(baseFilename, contacts);
    }

    return results;
  }

  /**
   * Internal helper to write a CSV file.
   *
   * @param {string} filename - The filename without extension
   * @param {import('../bot/GroupExtractor.js').Contact[]} contacts
   * @returns {Promise<string>} The absolute path to the CSV file
   */
  async #exportToCsv(filename, contacts) {
    const fullPath = path.join(config.outputDir, `${filename}.csv`);

    const csvWriter = createObjectCsvWriter({
      path: fullPath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'phone', title: 'Phone' },
        { id: 'jid', title: 'WhatsApp ID (JID)' },
        { id: 'role', title: 'Role' },
        { id: 'extractedAt', title: 'Extracted At' },
      ],
    });

    await csvWriter.writeRecords(contacts);

    log.info({ path: fullPath, count: contacts.length }, '📄 CSV export completed');
    return fullPath;
  }

  /**
   * Internal helper to write a JSON file.
   *
   * @param {string} filename - The filename without extension
   * @param {import('../bot/GroupExtractor.js').Contact[]} contacts
   * @returns {Promise<string>} The absolute path to the JSON file
   */
  async #exportToJson(filename, contacts) {
    const fullPath = path.join(config.outputDir, `${filename}.json`);

    const data = {
      metadata: {
        total: contacts.length,
        version: '2.0.0',
      },
      contacts,
    };

    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');

    log.info({ path: fullPath, count: contacts.length }, '📦 JSON export completed');
    return fullPath;
  }
}
