const { getOctokit } = require('@actions/github');

/**
 * Shared GitHub API helpers for automation scripts.
 * Usage: const utils = require('./automation-utils')(token, context);
 *
 * @param {string} token   - GitHub token from secrets.GITHUB_TOKEN
 * @param {object} context - @actions/github context object
 */
module.exports = (token, context) => {
  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;

  /**
   * Returns issue numbers linked to a PR via closing keywords
   * (Closes #N, Fixes #N, Resolves #N — GitHub's own engine, case-insensitive).
   */
  async function getClosingIssues(prNumber) {
    // TODO: implement
    // gh api graphql -f query='
    //   query($owner: String!, $repo: String!, $pr: Int!) {
    //     repository(owner: $owner, name: $repo) {
    //       pullRequest(number: $pr) {
    //         closingIssuesReferences(first: 10) {
    //           nodes { number }
    //         }
    //       }
    //     }
    //   }'
    throw new Error('stub — not yet implemented');
  }

  /** Applies a label to an issue or PR. No-op if the label does not exist. */
  async function applyLabel(issueNumber, label) {
    // TODO: implement
    throw new Error('stub — not yet implemented');
  }

  /** Removes a label from an issue or PR. No-op if the label is not present. */
  async function removeLabel(issueNumber, label) {
    // TODO: implement
    throw new Error('stub — not yet implemented');
  }

  /** Returns true if the label exists on the repository. */
  async function labelExists(label) {
    // TODO: implement
    throw new Error('stub — not yet implemented');
  }

  return { getClosingIssues, applyLabel, removeLabel, labelExists };
};
