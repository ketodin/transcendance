import core from '@actions/core';
import * as github from '@actions/github';
import log from '../utils/log.js';
import makeUtils from './automation-utils.js';

const _log = log('automation-state-branch');
const utils = makeUtils(core.getInput('token'), github.context);

const BRANCH_PATTERN = /^\w+\/(\d+)-/;

async function run() {
  const payload = github.context.payload;

  if (payload.ref_type !== 'branch') { _log.info(`ref_type is "${payload.ref_type}", skipping`); return; }

  const branchName = payload.ref;
  const match = branchName.match(BRANCH_PATTERN);
  if (!match) { _log.info(`"${branchName}" does not match naming pattern, skipping`); return; }

  const issueNumber = parseInt(match[1], 10);
  _log.group(`"${branchName}" -> issue #${issueNumber}`);

  await utils.removeLabel(issueNumber, 'status: todo');
  _log.info('Removed "status: todo"');

  await utils.applyLabel(issueNumber, 'status: in progress');
  _log.info('Applied "status: in progress"');

  _log.end();
}

run().catch((err) => { _log.error(err.message); process.exit(1); });
