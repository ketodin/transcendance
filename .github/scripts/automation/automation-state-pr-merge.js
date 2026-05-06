const core   = require('@actions/core');
const github = require('@actions/github');
const log    = require('../utils/log')('automation-state-pr-merge');
const utils  = require('./automation-utils')(core.getInput('token'), github.context);

async function run() {
  const pr = github.context.payload.pull_request;
  if (!pr) {
    log.warn('No pull request in payload, skipping');
    return;
  }

  if (!pr.merged) {
    log.info('PR closed without merging, skipping');
    return;
  }

  log.group(`PR #${pr.number} merged`);

  const issueNumbers = await utils.getClosingIssues(pr.number);
  if (issueNumbers.length === 0) {
    log.warn('No linked issues found via closingIssuesReferences, skipping');
    log.end();
    return;
  }

  for (const number of issueNumbers) {
    await utils.removeLabel(number, 'status: in review');
    await utils.applyLabel(number, 'status: done');
    log.info(`Issue #${number}: in review -> done`);
  }

  log.end();
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
