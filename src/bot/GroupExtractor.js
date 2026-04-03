/**
 * @fileoverview Group contact extractor logic.
 *
 * Responsibilities:
 *  - Fetch all WhatsApp groups the authenticated user is part of
 *  - Fetch participant metadata for a specific group
 *  - Transform raw Baileys data into clean domain objects
 *
 * Design Pattern: Service — stateless business logic, depends on injected socket
 */

import pLimit from 'p-limit';
import { createLogger } from '../utils/logger.js';
import { formatPhoneFromJid, isUserJid, sanitizeName } from '../utils/phoneFormatter.js';
import { config } from '../config/index.js';

const log = createLogger('GroupExtractor');

/**
 * @typedef {Object} GroupSummary
 * @property {string} id - Group JID (e.g., "1234567890-1234@g.us")
 * @property {string} name - Human-readable group name
 * @property {number} participants - Number of participants
 */

/**
 * @typedef {Object} Contact
 * @property {string} jid - Raw WhatsApp JID
 * @property {string} phone - Formatted phone number
 * @property {string} name - Display name (may be empty if not in contacts)
 * @property {string} role - "admin" | "superadmin" | "member"
 * @property {string} extractedAt - ISO 8601 timestamp
 */

/**
 * Extracts and transforms contact data from WhatsApp groups.
 * All methods are pure functions of the injected socket — no internal state.
 */
export class GroupExtractor {
  /** @type {import('@whiskeysockets/baileys').WASocket} */
  #socket;

  /**
   * @param {import('@whiskeysockets/baileys').WASocket} socket - Baileys socket instance
   */
  constructor(socket) {
    this.#socket = socket;
  }

  /**
   * Fetches all groups the authenticated user belongs to.
   * Applies optional name filtering from the config.
   * Includes a 3-attempt retry loop to handle slow initial sync.
   *
   * @returns {Promise<GroupSummary[]>} Sorted array of group summaries
   */
  async listGroups() {
    let attempts = 0;
    let filtered = [];

    while (attempts < 3) {
      log.info({ attempt: attempts + 1 }, 'Fetching group list from WhatsApp...');

      const rawGroups = await this.#socket.groupFetchAllParticipating();
      const groups = Object.values(rawGroups);

      log.debug({ count: groups.length }, 'Raw groups fetched');

      const filter = config.groupFilter.toLowerCase();

      filtered = groups
        .filter((g) => (filter ? g.subject?.toLowerCase().includes(filter) : true))
        .map((g) => ({
          id: g.id,
          name: g.subject ?? 'Unnamed Group',
          participants: g.participants?.length ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (filtered.length > 0) break;

      attempts++;
      if (attempts < 3) {
        log.warn('No groups found yet. Retrying in 2 seconds (WhatsApp sync in progress)...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (config.groupFilter && filtered.length > 0) {
      log.debug({ filter: config.groupFilter, found: filtered.length }, 'Groups filtered by name');
    }

    log.debug({ total: filtered.length }, 'Groups available');
    return filtered;
  }

  /**
   * Extracts and enriches all user contacts from a specific group.
   * Uses p-limit for controlled concurrency when enriching contact data.
   *
   * @param {string} groupId - The group JID
   * @returns {Promise<Contact[]>} Array of extracted and enriched contacts
   */
  async extractContacts(groupId) {
    log.info({ groupId }, 'Fetching group metadata...');

    const metadata = await this.#socket.groupMetadata(groupId);

    log.info(
      { group: metadata.subject, participantCount: metadata.participants.length },
      'Group metadata retrieved'
    );

    const limit = pLimit(config.concurrencyLimit);
    const extractedAt = new Date().toISOString();

    const contactPromises = metadata.participants
      .filter((p) => isUserJid(p.id))
      .map((participant) =>
        limit(async () => {
          // We already have the pushName in the metadata from group participants
          const name = participant.pushName || participant.name || '';

          /** @type {Contact} */
          const contact = {
            jid: participant.id,
            phone: formatPhoneFromJid(participant.id),
            name: sanitizeName(name),
            role: participant.admin === 'superadmin'
              ? 'superadmin'
              : participant.admin === 'admin'
                ? 'admin'
                : 'member',
            extractedAt,
          };

          return contact;
        })
      );

    const contacts = await Promise.all(contactPromises);

    log.info(
      {
        total: contacts.length,
        admins: contacts.filter((c) => c.role !== 'member').length,
      },
      '✅ Contacts extracted successfully'
    );

    return contacts;
  }
}
