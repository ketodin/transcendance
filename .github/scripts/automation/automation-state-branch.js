const core   = require('@actions/core');
const github = require('@actions/github');
const log    = require('../utils/log')('automation-state-branch');
const utils  = require('./automation-utils')(core.getInput('token'), github.context);

const BRANCH_PATTERN = /^\w+\/(\d+)-/;

async function run() {
  const payload = github.context.payload;

  if (payload.ref_type !== 'branch') {
    log.info(`ref_type is "${payload.ref_type}", skipping`);
    return;
  }

  const branchName = payload.ref;
  const match      = branchName.match(BRANCH_PATTERN);

  if (!match) {
    log.info(`"${branchName}" does not match naming pattern, skipping`);
    return;
  }

  const issueNumber = parseInt(match[1], 10);
  log.group(`"${branchName}" -> issue #${issueNumber}`);

  await utils.removeLabel(issueNumber, 'status: todo');
  log.info('Removed "status: todo"');

  await utils.applyLabel(issueNumber, 'status: in progress');
  log.info('Applied "status: in progress"');

  log.end();
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
