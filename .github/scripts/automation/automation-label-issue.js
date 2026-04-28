const core   = require('@actions/core');
const github = require('@actions/github');
const log    = require('../utils/log')('automation-label-issue');
const utils  = require('./automation-utils')(core.getInput('token'), github.context);

const SCOPE_MAP = {
  frontend: 'scope: frontend',
  backend:  'scope: backend',
  auth:     'scope: auth',
  game:     'scope: game',
  db:       'scope: db',
  shared:   'scope: shared',
  infra:    'scope: infra',
  i18n:     'scope: i18n',
};

function parseScopeFromBody(body) {
  if (!body) return null;
  const match = body.match(/###\s+Scope\s*\n+([^\n#]+)/);
  if (!match) return null;
  return match[1].trim().toLowerCase();
}

async function run() {
  const issue = github.context.payload.issue;
  if (!issue) {
    log.warn('No issue in payload, skipping');
    return;
  }

  log.group(`Issue #${issue.number}`);

  const scopeValue = parseScopeFromBody(issue.body);
  if (!scopeValue) {
    log.warn('No scope section found in issue body, skipping');
    log.end();
    return;
  }

  const label = SCOPE_MAP[scopeValue];
  if (!label) {
    log.warn(`Unknown scope value "${scopeValue}", skipping`);
    log.end();
    return;
  }

  await utils.applyLabel(issue.number, label);
  log.info(`Applied "${label}"`);
  log.end();
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
