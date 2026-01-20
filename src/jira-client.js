const axios = require('axios');
const { JIRA_CONFIG, CUSTOM_FIELDS, TEAMS, TEAM_SERENITY, JQL_FILTERS, VersionUtils } = require('./config');

// Only fetch fields we actually need (much faster than '*all')
const REQUIRED_FIELDS = [
  'summary',
  'issuetype',
  'status',
  'assignee',
  'labels',
  'fixVersions',
  'timetracking',
  CUSTOM_FIELDS.SPRINT,
  CUSTOM_FIELDS.HLE
].join(',');

// Fields for next sprint page (different columns)
const NEXT_SPRINT_REQUIRED_FIELDS = [
  'summary',
  'issuetype',
  'status',
  'labels',
  'assignee',
  'duedate',
  CUSTOM_FIELDS.SPRINT,
  CUSTOM_FIELDS.HLE,
  CUSTOM_FIELDS.WSJF
].join(',');

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
  constructor() {
    this.jiraUrl = process.env.JIRA_URL;
    this.jiraEmail = process.env.JIRA_EMAIL;
    this.jiraToken = process.env.JIRA_API_TOKEN;
    this.jiraCloudId = process.env.JIRA_CLOUD_ID;

    // Cache for sprint info (shared between endpoints)
    this.sprintCache = null;
    this.maxRetries = JIRA_CONFIG.MAX_RETRIES;
    this.retryDelay = JIRA_CONFIG.RETRY_DELAY_MS;
    this.timeout = JIRA_CONFIG.TIMEOUT_MS;
    this.maxResults = JIRA_CONFIG.MAX_RESULTS_PER_PAGE;

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
        fields: REQUIRED_FIELDS
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

    const jql = `filter=${filterIdNum} AND ${JQL_FILTERS.EXCLUDE_TYPES_AND_CLOSED}`;
    return this.fetchIssuesByJQL(jql, `filter ${filterIdNum}`);
  }

  /**
   * Fetch all issues by JQL query, excluding Epics
   * Uses token-based pagination to retrieve all results
   * @param {string} jql - JQL query string
   * @param {string} description - Description for logging (optional)
   * @returns {Promise<Array>} Array of all issues
   */
  async fetchIssuesByJQL(jql, description = 'JQL query') {
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

    console.log(`[Jira] Fetched ${allIssues.length} issues from ${description}`);
    return allIssues;
  }

  /**
   * Extract version number from sprint name (e.g., "6.20" from "6.20.0 (16. 9. - 29. 9)")
   * @param {string} sprintName - Sprint name
   * @returns {Object|null} Version object with major and minor, or null if not found
   */
  extractVersionFromSprintName(sprintName) {
    // Match pattern like "6.20" or "6.20.0"
    const versionMatch = sprintName.match(/^(\d+)\.(\d+)/);
    if (versionMatch) {
      return {
        major: parseInt(versionMatch[1]),
        minor: parseInt(versionMatch[2]),
        full: `${versionMatch[1]}.${versionMatch[2]}`
      };
    }
    return null;
  }

  /**
   * Parse start and end dates from sprint name (e.g., "6.20.0 (20. 1. - 2. 2.)")
   * @param {string} sprintName - Sprint name
   * @returns {Object|null} { startDate, endDate } or null if not found
   */
  parseSprintDates(sprintName) {
    // Match pattern like "(20. 1. - 2. 2.)" - captures both start and end dates
    const dateMatch = sprintName.match(/\((\d+)\.\s*(\d+)\.\s*-\s*(\d+)\.\s*(\d+)\.?\s*\)/);
    if (!dateMatch) return null;

    const startDay = parseInt(dateMatch[1]);
    const startMonth = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
    const endDay = parseInt(dateMatch[3]);
    const endMonth = parseInt(dateMatch[4]) - 1;

    const now = new Date();
    let year = now.getFullYear();

    // Create dates - handle year wrap-around for sprints crossing year boundary
    let startDate = new Date(year, startMonth, startDay);
    let endDate = new Date(year, endMonth, endDay);

    // If end is before start, end date is in next year (e.g., Dec-Jan sprint)
    if (endDate < startDate) {
      endDate = new Date(year + 1, endMonth, endDay);
    }

    // If both dates are more than 6 months in the future, shift to previous year
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (startDate > sixMonthsFromNow) {
      startDate = new Date(year - 1, startMonth, startDay);
      endDate = new Date(endDate < startDate ? year : year - 1, endMonth, endDay);
    }

    return { startDate, endDate };
  }

  /**
   * Parse end date from sprint name (legacy method for compatibility)
   * @param {string} sprintName - Sprint name
   * @returns {Date|null} End date or null if not found
   */
  parseSprintEndDate(sprintName) {
    const dates = this.parseSprintDates(sprintName);
    return dates ? dates.endDate : null;
  }

  /**
   * Determine current version based on sprint dates
   * Current sprint = the one where today is between start and end date
   * @param {Map} versionMap - Map of version string to array of sprints
   * @param {Array} sortedVersions - Array of version strings sorted ascending
   * @param {number} extendDays - Number of days to extend sprint end date (for next-sprint page)
   * @returns {string|null} Current version string or null
   */
  determineCurrentVersion(versionMap, sortedVersions, extendDays = 0) {
    const now = new Date();
    // Set to start of day for consistent comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Debug: log all sprint dates and find current
    for (const version of sortedVersions) {
      const sprints = versionMap.get(version);
      for (const sprint of sprints) {
        const dates = this.parseSprintDates(sprint.name);
        if (dates) {
          // Optionally extend end date (for next-sprint page: first N days of new sprint still show previous)
          const adjustedEnd = new Date(dates.endDate);
          if (extendDays > 0) {
            adjustedEnd.setDate(adjustedEnd.getDate() + extendDays);
          }

          const isCurrentSprint = today >= dates.startDate && today <= adjustedEnd;
          const logSuffix = extendDays > 0 ? ` (current until ${adjustedEnd.toISOString().split('T')[0]})` : '';
          console.log(`[Jira] Sprint ${sprint.name} -> ${dates.startDate.toISOString().split('T')[0]} to ${dates.endDate.toISOString().split('T')[0]}${logSuffix}${isCurrentSprint ? ' ← CURRENT' : ''}`);

          if (isCurrentSprint) {
            console.log(`[Jira] Determined current version: ${version}`);
            return version;
          }
        }
      }
    }

    // Fallback: if no sprint contains today, use the most recent one (last in sorted list)
    if (sortedVersions.length > 0) {
      const fallbackVersion = sortedVersions[sortedVersions.length - 1];
      console.log(`[Jira] No current sprint found by date, using fallback: ${fallbackVersion}`);
      return fallbackVersion;
    }

    return null;
  }

  /**
   * Calculate max allowed version (current + 1)
   * @param {string} currentVersion - Current version string (e.g., "6.20")
   * @returns {Object} Max version with major and minor
   */
  getMaxAllowedVersion(currentVersion) {
    const [major, minor] = currentVersion.split('.').map(Number);
    return {
      major,
      minor: minor + 1,
      full: `${major}.${minor + 1}`
    };
  }

  /**
   * Check if version is within allowed range
   * @param {string} version - Version string to check
   * @param {Object} maxVersion - Max allowed version object
   * @returns {boolean} True if version is allowed
   */
  isVersionAllowed(version, maxVersion) {
    const [major, minor] = version.split('.').map(Number);
    if (major < maxVersion.major) return true;
    if (major > maxVersion.major) return false;
    return minor <= maxVersion.minor;
  }

  /**
   * Extract unique sprints with version numbers from issues
   * @param {Array} issues - Array of issues with sprint field
   * @returns {Map} Map of sprintId -> {id, name, version}
   */
  extractSprintsFromIssues(issues) {
    const sprintMap = new Map();
    for (const issue of issues) {
      const sprints = issue.fields?.customfield_10000;
      if (!sprints || sprints.length === 0) continue;

      for (const sprint of sprints) {
        if (!sprint || !sprint.name || sprintMap.has(sprint.id)) continue;

        const version = this.extractVersionFromSprintName(sprint.name);
        if (version) {
          sprintMap.set(sprint.id, {
            id: sprint.id,
            name: sprint.name,
            version
          });
        }
      }
    }
    return sprintMap;
  }

  /**
   * Group sprints by version key
   * @param {Map} sprintMap - Map of sprintId -> sprint data
   * @returns {Object} { versionMap, sortedVersions }
   */
  groupSprintsByVersion(sprintMap) {
    const sprintsWithVersions = Array.from(sprintMap.values());
    console.log(`[Jira] Found ${sprintsWithVersions.length} unique sprints with version numbers`);

    const versionMap = new Map();
    for (const sprint of sprintsWithVersions) {
      const versionKey = sprint.version.full;
      if (!versionMap.has(versionKey)) {
        versionMap.set(versionKey, []);
      }
      versionMap.get(versionKey).push(sprint);
    }

    const sortedVersions = VersionUtils.sort(Array.from(versionMap.keys()));
    console.log(`[Jira] All versions found: ${sortedVersions.join(', ')}`);

    return { versionMap, sortedVersions };
  }

  /**
   * Select versions and collect sprint IDs
   * @param {Map} versionMap - Map of version -> sprints
   * @param {Array} sortedVersions - Sorted version strings
   * @param {number} sprintCount - Number of sprints to select
   * @param {boolean} useCurrentVersionFilter - Whether to filter by current version
   * @param {boolean} includeFutureSprints - Whether to include future sprints (default: false)
   * @returns {Object} { selectedVersions, sprintIds, currentVersion }
   */
  selectVersionsAndGetSprintIds(versionMap, sortedVersions, sprintCount, useCurrentVersionFilter = true, includeFutureSprints = false) {
    let currentVersion = null;
    let selectedVersions;

    if (useCurrentVersionFilter) {
      currentVersion = this.determineCurrentVersion(versionMap, sortedVersions);
      console.log(`[Jira] Current version: ${currentVersion}`);

      let maxVersion;
      if (includeFutureSprints) {
        maxVersion = this.getMaxAllowedVersion(currentVersion);
      } else {
        // Only allow current and past versions
        const [major, minor] = currentVersion.split('.').map(Number);
        maxVersion = { major, minor, full: currentVersion };
      }
      console.log(`[Jira] Max allowed version: ${maxVersion.full} (includeFuture: ${includeFutureSprints})`);

      const allowedVersions = sortedVersions.filter(v => this.isVersionAllowed(v, maxVersion));
      console.log(`[Jira] Allowed versions: ${allowedVersions.join(', ')}`);

      selectedVersions = allowedVersions.slice(-sprintCount);
    } else {
      selectedVersions = sortedVersions.slice(-sprintCount);
    }

    console.log(`[Jira] Selected versions: ${selectedVersions.join(', ')}`);

    const sprintIds = [];
    for (const version of selectedVersions) {
      const sprintsForVersion = versionMap.get(version);
      for (const sprint of sprintsForVersion) {
        sprintIds.push(sprint.id);
        console.log(`[Jira] Including sprint: ${sprint.name}`);
      }
    }

    console.log(`[Jira] Selected ${sprintIds.length} sprints`);

    return { selectedVersions, sprintIds, currentVersion };
  }

  /**
   * Fetch issues for all teams (last N sprints by version number)
   * Returns issues with team label attached
   * @param {number|null} requestedSprintCount - Optional override for sprint count
   * @returns {Promise<Object>} Object with issues array and sprintCount
   */
  async fetchAllTeamsIssues(requestedSprintCount = null) {
    const client = this.getAxiosInstance();
    const allTeams = Object.values(TEAMS);
    const sprintCountToUse = requestedSprintCount || allTeams[0].sprintCount;

    // Step 1: Fetch issues with ONLY sprint field to analyze available sprints
    const teamLabels = allTeams.map(t => `labels = "${t.label}"`).join(' OR ');
    const sprintAnalysisJql = `project = "${TEAM_SERENITY.project}" AND (${teamLabels}) AND sprint is not EMPTY AND ${JQL_FILTERS.EXCLUDE_TYPES} ORDER BY updated DESC`;

    // Calculate pages needed - start small, only fetch more for larger sprint requests
    // Default 6 sprints: 2 pages (200 issues) is usually enough
    // For more sprints, scale up proportionally
    const basePages = 2;
    const maxPages = sprintCountToUse <= 6 ? basePages : Math.ceil(sprintCountToUse / 3);
    const minSprintsNeeded = sprintCountToUse + 2; // Need a few extra for filtering

    console.log(`[Jira] Fetching issues for sprint analysis (target: ${sprintCountToUse} sprints, max pages: ${maxPages})`);
    console.log(`[Jira] JQL: ${sprintAnalysisJql}`);

    // Paginate through results to find all sprints
    const allSprintAnalysisIssues = [];
    let nextPageToken = null;
    let pageCount = 0;
    let foundSprintCount = 0;

    do {
      pageCount++;
      const params = {
        jql: sprintAnalysisJql,
        maxResults: '100',
        fields: 'customfield_10000,labels'
      };
      if (nextPageToken) {
        params.nextPageToken = nextPageToken;
      }

      const response = await client.get('/rest/api/3/search/jql', { params });
      const pageIssues = response.data.issues || [];
      allSprintAnalysisIssues.push(...pageIssues);

      // Count unique sprints found so far
      const tempSprintMap = this.extractSprintsFromIssues(allSprintAnalysisIssues);
      foundSprintCount = new Set(Array.from(tempSprintMap.values()).map(s => s.version.full)).size;

      nextPageToken = response.data.nextPageToken;
      console.log(`[Jira] Page ${pageCount}: ${pageIssues.length} issues, ${foundSprintCount} sprints found`);

      // Stop early if we have enough sprints
      if (foundSprintCount >= minSprintsNeeded) {
        console.log(`[Jira] Found enough sprints (${foundSprintCount} >= ${minSprintsNeeded}), stopping pagination`);
        break;
      }

      if (!nextPageToken || response.data.isLast) {
        break;
      }
    } while (pageCount < maxPages);

    console.log(`[Jira] Sprint analysis: ${allSprintAnalysisIssues.length} issues, ${foundSprintCount} sprints (${pageCount} pages)`);

    // Step 2-4: Extract sprints, group by version, sort
    const sprintMap = this.extractSprintsFromIssues(allSprintAnalysisIssues);
    const { versionMap, sortedVersions } = this.groupSprintsByVersion(sprintMap);

    // Step 5: Select versions and get sprint IDs (with current version filtering)
    const { selectedVersions, sprintIds, currentVersion } = this.selectVersionsAndGetSprintIds(
      versionMap, sortedVersions, sprintCountToUse, true
    );

    // Cache sprint info for reuse by other endpoints (e.g., next-sprint)
    this.sprintCache = { versionMap, sortedVersions };

    // Step 6: Fetch ONLY issues from selected sprints for all teams
    const fullJql = `project = "${TEAM_SERENITY.project}" AND (${teamLabels}) AND sprint IN (${sprintIds.join(',')}) AND ${JQL_FILTERS.EXCLUDE_TYPES_AND_CLOSED}`;
    const fullIssues = await this.fetchIssuesByJQL(fullJql, `All teams (${selectedVersions.length} versions)`);

    return {
      issues: fullIssues,
      sprintCount: selectedVersions.length,
      currentVersion
    };
  }

  /**
   * Fetch issues for TeamSerenity (last 6 sprints by version number)
   * Optimized approach using only Search API (works with read-only tokens):
   * 1. Fetch ~100 issues with ONLY sprint field (fast, minimal data)
   * 2. Extract unique sprints and select last 6 versions
   * 3. Fetch full issues from only those selected sprints
   * @returns {Promise<Array>} Array of all issues
   */
  async fetchTeamSerenityIssues() {
    const client = this.getAxiosInstance();

    // Step 1: Fetch issues with ONLY sprint field to analyze available sprints
    const jql = `project = "${TEAM_SERENITY.project}" AND labels = "${TEAM_SERENITY.label}" AND sprint is not EMPTY AND ${JQL_FILTERS.EXCLUDE_TYPES_AND_CLOSED}`;

    console.log(`[Jira] Fetching issues (sprint field only) to analyze sprints`);
    const response = await client.get('/rest/api/3/search/jql', {
      params: {
        jql,
        maxResults: '100',
        fields: 'customfield_10000'
      }
    });

    const issues = response.data.issues || [];
    console.log(`[Jira] Fetched ${issues.length} issues for sprint analysis`);

    // Step 2-4: Extract sprints, group by version, sort
    const sprintMap = this.extractSprintsFromIssues(issues);
    const { versionMap, sortedVersions } = this.groupSprintsByVersion(sprintMap);

    // Step 5: Select versions and get sprint IDs (no current version filtering)
    const { selectedVersions, sprintIds } = this.selectVersionsAndGetSprintIds(
      versionMap, sortedVersions, TEAM_SERENITY.sprintCount, false
    );

    // Step 6: Fetch ONLY issues from selected sprints
    const fullJql = `project = "${TEAM_SERENITY.project}" AND labels = "${TEAM_SERENITY.label}" AND sprint IN (${sprintIds.join(',')}) AND ${JQL_FILTERS.EXCLUDE_TYPES_AND_CLOSED}`;
    const fullIssues = await this.fetchIssuesByJQL(fullJql, `TeamSerenity (${selectedVersions.length} versions)`);

    return fullIssues;
  }

  /**
   * Calculate next version from current version
   * @param {string} currentVersion - Current version string (e.g., "6.20")
   * @returns {Object} Next version with major, minor, and full string
   */
  getNextVersion(currentVersion) {
    const [major, minor] = currentVersion.split('.').map(Number);
    return {
      major,
      minor: minor + 1,
      full: `${major}.${minor + 1}`
    };
  }

  /**
   * Fetch ALL issues for the next sprint (for team filtering on frontend)
   * @returns {Promise<Object>} Object with issues array and nextVersion
   */
  async fetchNextSprintIssues() {
    const client = this.getAxiosInstance();
    const allTeams = Object.values(TEAMS);

    let currentVersion, nextVersion, versionMap, sortedVersions;

    if (this.sprintCache && this.sprintCache.versionMap) {
      // Use cached sprint info from previous fetchAllTeamsIssues call
      console.log(`[Jira] Using cached sprint info`);
      versionMap = this.sprintCache.versionMap;
      sortedVersions = this.sprintCache.sortedVersions;
    } else {
      // Step 1: Do sprint analysis to determine current version
      const teamLabels = allTeams.map(t => `labels = "${t.label}"`).join(' OR ');
      const sprintAnalysisJql = `project = "${TEAM_SERENITY.project}" AND (${teamLabels}) AND sprint is not EMPTY AND ${JQL_FILTERS.EXCLUDE_TYPES} ORDER BY updated DESC`;

      console.log(`[Jira] Fetching issues for sprint analysis (next-sprint)`);
      const response = await client.get('/rest/api/3/search/jql', {
        params: {
          jql: sprintAnalysisJql,
          maxResults: '50',
          fields: 'customfield_10000'
        }
      });

      const analysisIssues = response.data.issues || [];
      const sprintMap = this.extractSprintsFromIssues(analysisIssues);
      const groupResult = this.groupSprintsByVersion(sprintMap);
      versionMap = groupResult.versionMap;
      sortedVersions = groupResult.sortedVersions;
    }

    // Determine current version with 2-day extension (first 2 days of new sprint still show previous)
    currentVersion = this.determineCurrentVersion(versionMap, sortedVersions, 2);
    nextVersion = this.getNextVersion(currentVersion);

    console.log(`[Jira] Current version: ${currentVersion}, next version: ${nextVersion.full}`);

    // Get sprint IDs for next version
    const nextVersionSprints = versionMap.get(nextVersion.full) || [];
    if (nextVersionSprints.length === 0) {
      console.log(`[Jira] No sprints found for version ${nextVersion.full}`);
      return {
        issues: [],
        nextVersion: nextVersion.full,
        currentVersion
      };
    }

    const sprintIds = nextVersionSprints.map(s => s.id);
    console.log(`[Jira] Found ${sprintIds.length} sprint(s) for version ${nextVersion.full}: ${nextVersionSprints.map(s => s.name).join(', ')}`);

    // Fetch ALL issues in next sprint (no team filter - filtering done on frontend)
    const nextSprintJql = `project = "BE Skip Pay" AND sprint IN (${sprintIds.join(',')}) AND ${JQL_FILTERS.EXCLUDE_DONE_STATES} ORDER BY cf[11737] DESC, created DESC`;

    console.log(`[Jira] Fetching next sprint issues`);
    console.log(`[Jira] JQL: ${nextSprintJql}`);

    // Fetch with required fields
    const allIssues = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      pageCount++;
      const params = {
        jql: nextSprintJql,
        maxResults: '100',
        fields: NEXT_SPRINT_REQUIRED_FIELDS
      };
      if (nextPageToken) {
        params.nextPageToken = nextPageToken;
      }

      const fetchResponse = await client.get('/rest/api/3/search/jql', { params });
      const pageIssues = fetchResponse.data.issues || [];
      allIssues.push(...pageIssues);

      nextPageToken = fetchResponse.data.nextPageToken;
      console.log(`[Jira] Page ${pageCount}: ${pageIssues.length} issues`);

      if (!nextPageToken || fetchResponse.data.isLast) {
        break;
      }
    } while (pageCount < 10); // Max 10 pages for next sprint

    console.log(`[Jira] Fetched ${allIssues.length} issues for next sprint`);

    return {
      issues: allIssues,
      nextVersion: nextVersion.full,
      currentVersion
    };
  }
}

// Export class (not singleton for better testability)
module.exports = JiraClient;
