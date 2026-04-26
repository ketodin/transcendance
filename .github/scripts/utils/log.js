const core = require('@actions/core');

/**
 * Logger factory for automation scripts.
 * Usage: const log = require('./utils/log')('script-name');
 *
 * @param {string} scriptName - Appears as [scriptName] prefix in every log line.
 */
module.exports = (scriptName) => ({
  info:  (msg) => core.info(`[${scriptName}] ${msg}`),
  warn:  (msg) => core.warning(`[${scriptName}] ${msg}`),
  error: (msg) => core.error(`[${scriptName}] ${msg}`),
  group: (msg) => core.startGroup(`[${scriptName}] ${msg}`),
  end:   ()    => core.endGroup(),
});
