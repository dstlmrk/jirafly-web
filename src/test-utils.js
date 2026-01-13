require('dotenv').config();
const axios = require('axios');

/**
 * Shared utilities for Jira API testing
 * Eliminates duplication across test files
 */

/**
 * Create configured Jira axios client
 * @returns {Object} Axios instance with auth headers
 */
function createJiraClient() {
  const token = process.env.JIRA_API_TOKEN;
  const url = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;

  if (!token || !url || !email) {
    throw new Error('Missing required environment variables: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN');
  }

  const credentials = `${email}:${token}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');

  return axios.create({
    baseURL: url,
    headers: {
      'Authorization': `Basic ${base64Credentials}`,
      'Accept': 'application/json'
    }
  });
}

/**
 * Make a GET request to Jira API
 * @param {string} endpoint - API endpoint (e.g., '/rest/api/3/myself')
 * @param {Object} options - Additional axios options
 * @returns {Promise<Object>} Response data
 */
async function jiraGet(endpoint, options) {
  if (!endpoint) {
    throw new Error('jiraGet requires an endpoint');
  }
  if (!options) {
    throw new Error('jiraGet requires options object');
  }
  const client = createJiraClient();

  try {
    const response = await client.get(endpoint, options);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

/**
 * Log test result with consistent formatting
 * @param {string} testName - Name of the test
 * @param {boolean} success - Whether test passed
 * @param {string} message - Additional message
 */
function logTestResult(testName, success, message = '') {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}${message ? ': ' + message : ''}`);
}

/**
 * Log test header
 * @param {string} title - Test suite title
 */
function logTestHeader(title) {
  console.log(`\n${title}\n`);
}

/**
 * Print array items with limit
 * @param {Array} items - Array of items to print
 * @param {Function} formatter - Function to format each item
 * @param {number} limit - Maximum number of items to print
 */
function printItems(items, formatter, limit = 10) {
  if (items.length === 0) {
    console.log('  (no items)');
    return;
  }

  items.slice(0, limit).forEach(item => {
    console.log(`  ${formatter(item)}`);
  });

  if (items.length > limit) {
    console.log(`  ... and ${items.length - limit} more`);
  }
}

module.exports = {
  createJiraClient,
  jiraGet,
  logTestResult,
  logTestHeader,
  printItems
};
