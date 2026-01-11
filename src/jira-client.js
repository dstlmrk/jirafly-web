const axios = require('axios');
const { JIRA_CONFIG } = require('./config');

/**
 * Jira API client for fetching issues
 * Uses Basic Auth (email + API token)
 * Supports both scoped tokens (with Cloud ID) and unscoped tokens
 * Implements retry logic and proper error handling
 */

const ERROR_MESSAGES = {
  401: 'Jira authentication failed - check JIRA_EMAIL and JIRA_API_TOKEN',
  404: 'Jira resource not found - check filter ID or Jira URL',
  429: 'Jira rate limit exceeded - too many requests'
};

class JiraClient {
  constructor(config) {
    if (config) {
      this.jiraUrl = config.jiraUrl;
      this.jiraEmail = config.jiraEmail;
      this.jiraToken = config.jiraToken;
      this.jiraCloudId = config.jiraCloudId;
      this.maxRetries = config.maxRetries;
      this.retryDelay = config.retryDelay;
      this.timeout = config.timeout;
      this.maxResults = config.maxResults;
    } else {
      this.jiraUrl = process.env.JIRA_URL;
      this.jiraEmail = process.env.JIRA_EMAIL;
      this.jiraToken = process.env.JIRA_API_TOKEN;
      this.jiraCloudId = process.env.JIRA_CLOUD_ID;
      this.maxRetries = JIRA_CONFIG.MAX_RETRIES;
      this.retryDelay = JIRA_CONFIG.RETRY_DELAY_MS;
      this.timeout = JIRA_CONFIG.TIMEOUT_MS;
      this.maxResults = JIRA_CONFIG.MAX_RESULTS_PER_PAGE;
    }

    this.axiosInstance = null;
  }

  /**
   * Validate configuration
   * @throws {Error} If required config is missing
   */
  validateConfig() {
    if (!this.jiraUrl || !this.jiraEmail || !this.jiraToken) {
      throw new Error(
        'Missing required environment variables: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN'
      );
    }
  }

  /**
   * Get or create axios instance with default configuration
   * @returns {AxiosInstance} Configured axios instance
   */
  getAxiosInstance() {
    if (this.axiosInstance) {
      return this.axiosInstance;
    }

    this.validateConfig();

    let baseURL;
    if (this.jiraCloudId) {
      baseURL = `https://api.atlassian.com/ex/jira/${this.jiraCloudId}`;
    } else {
      baseURL = this.jiraUrl.replace(/\/$/, '');
    }

    this.axiosInstance = axios.create({
      baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return this.axiosInstance;
  }

  /**
   * Generate Basic Auth header
   * @returns {string} Base64 encoded credentials
   */
  getAuthHeader() {
    const credentials = `${this.jiraEmail}:${this.jiraToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a request to Jira search API with retry logic
   * @param {string} jql - JQL query string
   * @param {string|null} nextPageToken - Token for next page (null for first page)
   * @param {number} maxResults - Number of results per page
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Response with issues and nextPageToken
   */
  async makeRequest(jql, nextPageToken, maxResults, retryCount) {
    const client = this.getAxiosInstance();

    try {
      // Jira REST API v3 search/jql endpoint uses GET with token-based pagination
      const params = {
        jql,
        maxResults: maxResults.toString(),
        fields: '*all'
      };

      // Add nextPageToken if provided (for pagination)
      if (nextPageToken) {
        params.nextPageToken = nextPageToken;
      }

      const response = await client.get('/rest/api/3/search/jql', { params });

      return {
        issues: response.data.issues || [],
        nextPageToken: response.data.nextPageToken || null,
        isLast: response.data.isLast || false
      };

    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      const shouldRetry = isRetryable && retryCount < this.maxRetries;

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        console.warn(
          `Request failed (attempt ${retryCount + 1}/${this.maxRetries}), ` +
          `retrying in ${delay}ms... Error: ${error.message}`
        );

        await this.sleep(delay);
        return this.makeRequest(jql, nextPageToken, maxResults, retryCount + 1);
      }

      throw this.formatError(error);
    }
  }

  /**
   * Determine if an error is retryable
   * @param {Error} error - Axios error
   * @returns {boolean} True if retryable
   */
  isRetryableError(error) {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    if (status === 429) {
      return true;
    }

    if (status >= 500 && status < 600) {
      return true;
    }

    return false;
  }

  /**
   * Format error for better error messages
   * @param {Error} error - Axios error
   * @returns {Error} Formatted error
   */
  formatError(error) {
    if (error.response) {
      const status = error.response.status;
      const statusMessage = ERROR_MESSAGES[status];

      if (statusMessage) {
        return new Error(statusMessage);
      }

      const data = error.response.data;
      let message;

      if (data && data.errorMessages && data.errorMessages[0]) {
        message = data.errorMessages[0];
      } else if (data && data.message) {
        message = data.message;
      } else {
        message = 'Unknown error';
      }

      return new Error(`Jira API error (${status}): ${message}`);
    }

    if (error.request) {
      return new Error('No response from Jira API - check network connection and JIRA_URL');
    }

    return new Error(`Request error: ${error.message}`);
  }

  /**
   * Fetch all issues from a Jira filter, excluding Epics
   * Uses token-based pagination to retrieve all results
   * @param {number|string} filterId - Jira filter ID
   * @returns {Promise<Array>} Array of all issues
   */
  async fetchIssuesByFilter(filterId) {
    const filterIdNum = parseInt(filterId, 10);
    if (isNaN(filterIdNum) || filterIdNum <= 0) {
      throw new Error(`Invalid filter ID: ${filterId}. Must be a positive number.`);
    }

    const jql = `filter=${filterIdNum} AND type != Epic`;
    const allIssues = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      pageCount++;
      const response = await this.makeRequest(jql, nextPageToken, this.maxResults, 0);

      allIssues.push(...response.issues);
      nextPageToken = response.nextPageToken;

      if (response.issues.length === 0 && nextPageToken) {
        console.warn('[Jira] Empty page with nextPageToken, stopping');
        break;
      }

      if (response.isLast) {
        break;
      }

      if (!nextPageToken) {
        break;
      }
    } while (nextPageToken);

    console.log(`[Jira] Fetched ${allIssues.length} issues from filter ${filterIdNum}`);
    return allIssues;
  }
}

// Export class (not singleton for better testability)
module.exports = JiraClient;
