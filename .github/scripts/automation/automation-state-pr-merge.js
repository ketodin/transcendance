import core from '@actions/core';
import * as github from '@actions/github';
import log from '../utils/log.js';
import makeUtils from './automation-utils.js';

const _log = log('automation-state-pr-merge');
const utils = makeUtils(core.getInput('token'), github.context);

async function run() {
  const pr = github.context.payload.pull_request;
  if (!pr) { _log.warn('No pull request in payload, skipping'); return; }
  if (!pr.merged) { _log.info('PR closed without merging, skipping'); return; }

  _log.group(`PR #${pr.number} merged`);

  const issueNumbers = await utils.getClosingIssues(pr.number);
  if (issueNumbers.length === 0) { _log.warn('No linked issues found via closingIssuesReferences, skipping'); _log.end(); return; }

  for (const number of issueNumbers) {
    await utils.removeLabel(number, 'status: in review');
    await utils.applyLabel(number, 'status: done');
    _log.info(`Issue #${number}: in review -> done`);
  }

  _log.end();
}

run().catch((err) => { _log.error(err.message); process.exit(1); });
