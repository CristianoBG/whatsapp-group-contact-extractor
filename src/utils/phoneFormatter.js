/**
 * @fileoverview Phone number formatting and validation utilities.
 * Handles WhatsApp JID (Jabber ID) parsing and normalization.
 */

/**
 * Extracts a clean E.164-style phone number from a WhatsApp JID.
 * WhatsApp JIDs have the format: 5511987654321@s.whatsapp.net
 *
 * @param {string} jid - The WhatsApp JID string
 * @returns {string} Formatted phone number (e.g., "+55 11 98765-4321")
 */
export function formatPhoneFromJid(jid) {
  if (!jid || typeof jid !== 'string') {
    return '';
  }

  // Remove the @s.whatsapp.net or @g.us suffix
  const number = jid.split('@')[0];

  // Remove any non-numeric characters (e.g., colons in broadcast JIDs)
  const digits = number.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return formatBrazilianPhone(digits);
}

/**
 * Formats a digit string into a Brazilian phone number.
 * Handles both 10-digit (landline) and 11-digit (mobile) numbers.
 *
 * @param {string} digits - Raw digits (e.g., "5511987654321")
 * @returns {string} Formatted number (e.g., "+55 11 98765-4321")
 */
function formatBrazilianPhone(digits) {
  // International format with country code (55 = Brazil)
  if (digits.startsWith('55') && digits.length >= 12) {
    const countryCode = '+55';
    const rest = digits.slice(2);
    const areaCode = rest.slice(0, 2);
    const local = rest.slice(2);

    if (local.length === 9) {
      // Mobile: 9XXXX-XXXX
      return `${countryCode} ${areaCode} ${local.slice(0, 5)}-${local.slice(5)}`;
    } else if (local.length === 8) {
      // Landline: XXXX-XXXX
      return `${countryCode} ${areaCode} ${local.slice(0, 4)}-${local.slice(4)}`;
    }
  }

  // Fallback: return with + prefix for international numbers
  return `+${digits}`;
}

/**
 * Checks if a JID represents a real user (not a group).
 *
 * @param {string} jid - The WhatsApp JID to check
 * @returns {boolean} True if the JID is a user JID
 */
export function isUserJid(jid) {
  if (typeof jid !== 'string') return false;
  return jid.includes('@s.whatsapp.net') || jid.includes('@c.us') || jid.includes('@lid');
}

/**
 * Sanitizes a name string for CSV export (removes quotes, trims whitespace).
 *
 * @param {string} name - Raw display name
 * @returns {string} Sanitized name
 */
export function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name.trim().replace(/["\n\r]/g, ' ');
}
