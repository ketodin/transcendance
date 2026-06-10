import { core } from '@actions/core';
import * as github from '@actions/github';
import log from '../utils/log.js';
import makeUtils from './automation-utils.js';

const _log = log('automation-state-pr-open');
const utils = makeUtils(core.getInput('token'), github.context);

async function run() {
	const pr = github.context.payload.pull_request;
	if (!pr) {
		_log.warn('No pull request in payload, skipping');
		return;
	}

	_log.group(`PR #${pr.number} opened/ready`);

	const issueNumbers = await utils.getClosingIssues(pr.number);
	if (issueNumbers.length === 0) {
		_log.warn('No linked issues found via closingIssuesReferences, skipping');
		_log.end();
		return;
	}

	for (const number of issueNumbers) {
		await utils.removeLabel(number, 'status: in progress');
		await utils.applyLabel(number, 'status: in review');
		_log.info(`Issue #${number}: in progress -> in review`);
	}

	_log.end();
}

run().catch((err) => {
	_log.error(err.message);
	process.exit(1);
});
