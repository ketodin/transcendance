const core   = require('@actions/core');
const github = require('@actions/github');
const log    = require('../utils/log')('automation-label-pr');
const utils  = require('./automation-utils')(core.getInput('token'), github.context);

const TITLE_REGEX  = /^(\w+)(?:\((\w+)\))?!?:\s.+/;
const VALID_TYPES  = ['feat', 'fix', 'refactor', 'style', 'test', 'ci', 'chore', 'docs', 'perf', 'security'];
const VALID_SCOPES = ['frontend', 'backend', 'auth', 'game', 'db', 'shared', 'infra', 'i18n'];

async function run() {
  const pr = github.context.payload.pull_request;
  if (!pr) {
    log.warn('No pull request in payload, skipping');
    return;
  }

  log.group(`PR #${pr.number}: "${pr.title}"`);

  const match = pr.title.match(TITLE_REGEX);
  if (!match) {
    log.warn('Title does not match conventional commit format, skipping');
    log.end();
    return;
  }

  const [, rawType, rawScope] = match;
  const type  = rawType.toLowerCase();
  const scope = rawScope ? rawScope.toLowerCase() : null;

  const current = await utils.getCurrentLabels(pr.number);
  const stale   = current.filter(l => l.startsWith('type: ') || l.startsWith('scope: '));

  for (const label of stale) {
    await utils.removeLabel(pr.number, label);
    log.info(`Removed stale "${label}"`);
  }

  if (VALID_TYPES.includes(type)) {
    await utils.applyLabel(pr.number, `type: ${type}`);
    log.info(`Applied "type: ${type}"`);
  } else {
    log.warn(`Unknown type "${type}", skipping`);
  }

  if (scope) {
    if (VALID_SCOPES.includes(scope)) {
      await utils.applyLabel(pr.number, `scope: ${scope}`);
      log.info(`Applied "scope: ${scope}"`);
    } else {
      log.warn(`Unknown scope "${scope}", skipping`);
    }
  }

  log.end();
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
