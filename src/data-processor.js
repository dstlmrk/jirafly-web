/**
 * Data processor for Jira issues
 * Handles version extraction, categorization, and aggregation
 */

const {
  CATEGORIES,
  CATEGORY_ORDER,
  LABELS,
  GROUP_BY_OPTIONS,
  CUSTOM_FIELDS,
  UNGROUPED
} = require('./config');

/**
 * Extract version number (X.Y pattern) from version name
 * @param {string} versionName - Version or sprint name (e.g., "6.12.0 (16. 9. - 29. 9)")
 * @returns {string} Extracted version number (e.g., "6.12") or "Ungrouped"
 */
function extractVersionNumber(versionName) {
  const versionPart = versionName.split(' ')[0];
  const match = versionPart.match(/(\d+\.\d+)/);
  return match[1];
}

/**
 * Get latest item from array by name (descending sort)
 * @param {Array} items - Array of items with 'name' property
 * @returns {Object|null} Latest item or null
 */
function getLatestByName(items) {
  return items.reduce((latest, current) => {
    if (!latest) {
      return current;
    }

    const comparison = latest.name.localeCompare(current.name, undefined, { numeric: true });

    if (comparison >= 0) {
      return latest;
    }

    return current;
  }, null);
}

/**
 * Extract group key (version or sprint) from issue
 * @param {Object} issue - Jira issue object
 * @param {string} groupBy - 'fix_version' or 'sprint'
 * @returns {string} Group key (version number or "Ungrouped")
 */
function extractGroupKey(issue, groupBy) {
  const fields = issue.fields;

  let items;
  if (groupBy === GROUP_BY_OPTIONS.SPRINT) {
    items = fields[CUSTOM_FIELDS.SPRINT];
  } else {
    items = fields.fixVersions;
  }

  const latest = getLatestByName(items);
  return extractVersionNumber(latest.name);
}

/**
 * Parse HLE value with error handling
 * @param {*} hleRaw - Raw HLE value from Jira
 * @param {string} issueKey - Issue key for logging
 * @returns {number} Parsed HLE value or 0
 */
function parseHLE(hleRaw, issueKey) {
  const hleValue = parseFloat(hleRaw);

  if (isNaN(hleValue)) {
    console.warn(`[DataProcessor] Invalid HLE value for issue ${issueKey}: ${hleRaw}`);
  }

  return hleValue;
}

/**
 * Categorize issue based on labels and type
 * Priority order: Excluded > Maintenance > Bug > Product
 * @param {Object} issue - Jira issue object
 * @returns {string} Category name
 */
function categorizeIssue(issue) {
  const fields = issue.fields;
  const labels = fields.labels;
  const issueType = fields.issuetype.name;

  if (labels.some(label => LABELS.EXCLUDED.includes(label))) {
    return CATEGORIES.EXCLUDED;
  }

  if (labels.some(label => LABELS.MAINTENANCE.includes(label))) {
    return CATEGORIES.MAINTENANCE;
  }

  if (issueType === 'Bug') {
    return CATEGORIES.BUG;
  }

  return CATEGORIES.PRODUCT;
}

/**
 * Initialize group structure for counts and HLE
 * @returns {Object} Empty group structure
 */
function initializeGroupStructure() {
  return CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});
}

/**
 * Validate process inputs
 * @param {Array} issues - Array of Jira issue objects
 * @param {string} groupBy - Grouping option
 * @returns {string} Validated groupBy value
 * @throws {Error} If issues is not an array
 */
function validateProcessInput(issues, groupBy) {
  if (!Array.isArray(issues)) {
    throw new Error(`processIssues expects an array, got ${typeof issues}`);
  }

  if (!Object.values(GROUP_BY_OPTIONS).includes(groupBy)) {
    throw new Error(`Invalid groupBy value: ${groupBy}. Must be one of: ${Object.values(GROUP_BY_OPTIONS).join(', ')}`);
  }

  return groupBy;
}

/**
 * Aggregate issues by group and category
 * @param {Array} issues - Array of Jira issue objects
 * @param {string} groupBy - Grouping option
 * @returns {Object} Counts and HLE values by group
 */
function aggregateIssuesByGroup(issues, groupBy) {
  const countsByGroup = {};
  const hleByGroup = {};

  for (const issue of issues) {
    const groupKey = extractGroupKey(issue, groupBy);
    const category = categorizeIssue(issue);
    const hleValue = parseHLE(issue.fields[CUSTOM_FIELDS.HLE], issue.key);

    if (!countsByGroup[groupKey]) {
      countsByGroup[groupKey] = initializeGroupStructure();
      hleByGroup[groupKey] = initializeGroupStructure();
    }

    countsByGroup[groupKey][category]++;
    hleByGroup[groupKey][category] += hleValue;
  }

  return { countsByGroup, hleByGroup };
}

/**
 * Sort groups naturally with Ungrouped at the end
 * @param {Object} countsByGroup - Counts by group
 * @returns {Array} Sorted group names
 */
function sortGroups(countsByGroup) {
  return Object.keys(countsByGroup).sort((a, b) => {
    if (a === UNGROUPED) return 1;
    if (b === UNGROUPED) return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

/**
 * Round HLE values to 1 decimal place
 * @param {Array} groups - Group names
 * @param {Object} hleByGroup - HLE values by group
 */
function roundHLEValues(groups, hleByGroup) {
  for (const group of groups) {
    for (const category of CATEGORY_ORDER) {
      hleByGroup[group][category] = Math.round(hleByGroup[group][category] * 10) / 10;
    }
  }
}

/**
 * Process all issues and aggregate by group and category
 * @param {Array} issues - Array of Jira issue objects
 * @param {string} groupBy - 'fix_version' or 'sprint'
 * @returns {Object} Processed data with counts and HLE sums
 * @throws {Error} If issues is not an array
 */
function processIssues(issues, groupBy) {
  groupBy = validateProcessInput(issues, groupBy);

  console.log(`[DataProcessor] Processing ${issues.length} issues grouped by ${groupBy}`);

  const { countsByGroup, hleByGroup } = aggregateIssuesByGroup(issues, groupBy);
  const groups = sortGroups(countsByGroup);
  roundHLEValues(groups, hleByGroup);

  console.log(`[DataProcessor] Processed ${groups.length} groups`);

  return {
    groups,
    categories: CATEGORY_ORDER,
    countsByGroup,
    hleByGroup,
    totalIssues: issues.length
  };
}

module.exports = {
  // Main functions
  processIssues,

  // Helper functions (exported for testing)
  extractVersionNumber,
  extractGroupKey,
  categorizeIssue,

  // Constants (exported for reference)
  CATEGORIES,
  GROUP_BY_OPTIONS,
  CUSTOM_FIELDS
};
