const { getOctokit } = require('@actions/github');

const CLOSING_ISSUES_QUERY = `
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        closingIssuesReferences(first: 10) {
          nodes { number }
        }
      }
    }
  }
`;

/**
 * Shared GitHub API helpers for automation scripts.
 * Usage: const utils = require('./automation-utils')(core.getInput('token'), github.context);
 *
 * @param {string} token   - GitHub token from core.getInput('token')
 * @param {object} context - @actions/github context object
 */
module.exports = (token, context) => {
  const octokit         = getOctokit(token);
  const { owner, repo } = context.repo;

  /**
   * Returns issue numbers linked to a PR via closing keywords.
   * Uses GitHub's own engine — handles Closes/Fixes/Resolves, case-insensitive.
   */
  async function getClosingIssues(prNumber) {
    const result = await octokit.graphql(CLOSING_ISSUES_QUERY, {
      owner,
      repo,
      pr: prNumber,
    });
    return result.repository.pullRequest.closingIssuesReferences.nodes.map(n => n.number);
  }

  /** Applies a label to an issue or PR. */
  async function applyLabel(issueNumber, label) {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [label],
    });
  }

  /**
   * Removes a label from an issue or PR.
   * No-op if the label is not present (404 is swallowed).
   */
  async function removeLabel(issueNumber, label) {
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
    } catch (err) {
      if (err.status === 404) return;
      throw err;
    }
  }

  /** Returns true if the label exists in the repository. */
  async function labelExists(label) {
    try {
      await octokit.rest.issues.getLabel({ owner, repo, name: label });
      return true;
    } catch (err) {
      if (err.status === 404) return false;
      throw err;
    }
  }

  /** Returns all label names currently applied to an issue or PR. */
  async function getCurrentLabels(issueNumber) {
    const { data } = await octokit.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return data.map(l => l.name);
  }

  return { getClosingIssues, applyLabel, removeLabel, labelExists, getCurrentLabels };
};
