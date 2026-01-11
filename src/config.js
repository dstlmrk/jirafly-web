/**
 * Centralized configuration for Jirafly
 * All magic numbers, field IDs, and constants in one place
 */

// Jira Client Configuration
const JIRA_CONFIG = Object.freeze({
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 30000,
  MAX_RESULTS_PER_PAGE: 100
});

// Custom Jira Field IDs
const CUSTOM_FIELDS = Object.freeze({
  SPRINT: 'customfield_10000',
  HLE: 'customfield_11605'
});

// Issue Categories
const CATEGORIES = Object.freeze({
  EXCLUDED: 'Excluded',
  MAINTENANCE: 'Maintenance',
  BUG: 'Bug',
  PRODUCT: 'Product'
});

const CATEGORY_ORDER = Object.freeze([
  CATEGORIES.EXCLUDED,
  CATEGORIES.MAINTENANCE,
  CATEGORIES.BUG,
  CATEGORIES.PRODUCT
]);

// Label Definitions
const LABELS = Object.freeze({
  EXCLUDED: ['RatioExcluded', 'Bughunting'],
  MAINTENANCE: ['Maintenance', 'DevOps']
});

// Grouping Options
const GROUP_BY_OPTIONS = Object.freeze({
  FIX_VERSION: 'fix_version',
  SPRINT: 'sprint'
});

// Chart Colors
const CHART_COLORS = Object.freeze({
  [CATEGORIES.EXCLUDED]: '#FFFF99',    // light yellow
  [CATEGORIES.MAINTENANCE]: '#87CEEB', // light blue
  [CATEGORIES.BUG]: '#FFC0CB',         // light pink
  [CATEGORIES.PRODUCT]: '#98FB98'      // light green
});

// Other Constants
const UNGROUPED = 'Ungrouped';

module.exports = {
  JIRA_CONFIG,
  CUSTOM_FIELDS,
  CATEGORIES,
  CATEGORY_ORDER,
  LABELS,
  GROUP_BY_OPTIONS,
  CHART_COLORS,
  UNGROUPED
};
