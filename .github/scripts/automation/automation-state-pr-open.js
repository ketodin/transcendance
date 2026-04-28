const core = require('@actions/core');
const github = require('@actions/github');
const log = require('./utils/log')('automation-state-pr-open');
// const utils = require('./automation-utils')(core.getInput('token'), github.context);

async function run() {
  log.info('stub — not yet implemented');
}

run().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
