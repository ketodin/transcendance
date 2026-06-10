import core from '@actions/core';
import * as github from '@actions/github';
import log from '../utils/log.js';
import makeUtils from './automation-utils.js';

const _log = log('automation-label-issue');
const utils = makeUtils(core.getInput('token'), github.context);

const SCOPE_MAP = {
	frontend: 'scope: frontend',
	backend: 'scope: backend',
	auth: 'scope: auth',
	game: 'scope: game',
	db: 'scope: db',
	shared: 'scope: shared',
	infra: 'scope: infra',
	i18n: 'scope: i18n'
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
		_log.warn('No issue in payload, skipping');
		return;
	}

	_log.group(`Issue #${issue.number}`);

	const scopeValue = parseScopeFromBody(issue.body);
	if (!scopeValue) {
		_log.warn('No scope section found in issue body, skipping');
		_log.end();
		return;
	}

	const label = SCOPE_MAP[scopeValue];
	if (!label) {
		_log.warn(`Unknown scope value "${scopeValue}", skipping`);
		_log.end();
		return;
	}

	await utils.applyLabel(issue.number, label);
	_log.info(`Applied "${label}"`);
	_log.end();
}

run().catch((err) => {
	_log.error(err.message);
	process.exit(1);
});
