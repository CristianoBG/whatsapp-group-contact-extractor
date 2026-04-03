/**
 * @fileoverview Interactive CLI prompts using Inquirer.js.
 * Abstracts all user interaction into a single module for easy testing/mocking.
 */

import inquirer from 'inquirer';

/**
 * Prompts the user to select a group from a list.
 *
 * @param {Array<{name: string, id: string, participants: number}>} groups
 *   Array of group metadata objects
 * @returns {Promise<string>} The selected group's JID
 */
export async function promptGroupSelection(groups) {
  if (groups.length === 0) {
    throw new Error('No groups available to select from.');
  }

  const choices = groups.map((group) => ({
    name: `${group.name}  (${group.participants} members)`,
    value: group.id,
    short: group.name,
  }));

  const { groupId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'groupId',
      message: 'Select the WhatsApp group to extract contacts from:',
      choices,
      pageSize: 15,
    },
  ]);

  return groupId;
}

/**
 * Prompts the user to confirm an action.
 *
 * @param {string} message - The confirmation message
 * @param {boolean} [defaultValue=true] - The default answer
 * @returns {Promise<boolean>} Whether the user confirmed
 */
export async function promptConfirm(message, defaultValue = true) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);
  return confirmed;
}

/**
 * Prompts the user to choose the export format.
 *
 * @returns {Promise<'csv' | 'json' | 'both'>} The selected format
 */
export async function promptExportFormat() {
  const { format } = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Choose the export format:',
      choices: [
        { name: '📄 CSV (recommended — opens in Excel/Sheets)', value: 'csv' },
        { name: '📦 JSON (for developers/APIs)', value: 'json' },
        { name: '✨ Both CSV and JSON', value: 'both' },
      ],
      default: 'csv',
    },
  ]);
  return format;
}

/**
 * Prompts the user if they want to extract another group.
 *
 * @returns {Promise<boolean>}
 */
export async function promptContinue() {
  return promptConfirm('Would you like to extract contacts from another group?', false);
}
