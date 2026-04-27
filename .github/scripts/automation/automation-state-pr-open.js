const core   = require('@actions/core');
const github = require('@actions/github');
const log    = require('../utils/log')('automation-state-pr-open');
const utils  = require('./automation-utils')(core.getInput('token'), github.context);

async function run() {
  const pr = github.context.payload.pull_request;
  if (!pr) {
    log.warn('No pull request in payload, skipping');
    return;
  }

  log.group(`PR #${pr.number} opened/ready`);

  const issueNumbers = await utils.getClosingIssues(pr.number);
  if (issueNumbers.length === 0) {
    log.warn('No linked issues found via closingIssuesReferences, skipping');
    log.end();
    return;
  }

  for (const number of issueNumbers) {
    await utils.removeLabel(number, 'status: in progress');
    await utils.applyLabel(number, 'status: in review');
    log.info(`Issue #${number}: in progress -> in review`);
  }

  log.end();
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
