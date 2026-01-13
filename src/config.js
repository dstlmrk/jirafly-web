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
  MAINTENANCE: ['Maintenance']
});

// Grouping Options
const GROUP_BY_OPTIONS = Object.freeze({
  FIX_VERSION: 'fix_version',
  SPRINT: 'sprint'
});

// Chart Colors
const CHART_COLORS = Object.freeze({
  [CATEGORIES.EXCLUDED]: '#f9a8d4',    // magenta
  [CATEGORIES.MAINTENANCE]: '#93c5fd', // blue
  [CATEGORIES.BUG]: '#fca5a5',         // red
  [CATEGORIES.PRODUCT]: '#86efac'      // green
});

// Team Configuration Defaults
const TEAM_DEFAULTS = Object.freeze({
  project: 'KNJ',
  boardId: 102,
  sprintCount: 6
});

// Team Configurations
const TEAMS = Object.freeze({
  SERENITY: { name: 'TeamSerenity', label: 'TeamSerenity', ...TEAM_DEFAULTS },
  KOSMIK: { name: 'TeamKosmik', label: 'TeamKosmik', ...TEAM_DEFAULTS },
  FALCON: { name: 'TeamFalcon', label: 'TeamFalcon', ...TEAM_DEFAULTS },
  DISCOVERY: { name: 'TeamDiscovery', label: 'TeamDiscovery', ...TEAM_DEFAULTS }
});

const TEAM_SERENITY = TEAMS.SERENITY;

// JQL Query Filters
const JQL_FILTERS = Object.freeze({
  EXCLUDE_TYPES: 'type != Epic AND type != Sub-task',
  EXCLUDE_CLOSED: 'status != Closed',
  EXCLUDE_TYPES_AND_CLOSED: 'type != Epic AND type != Sub-task AND status != Closed'
});

// Version Utilities
const VersionUtils = Object.freeze({
  parse(versionStr) {
    const parts = versionStr.split('.').map(Number);
    if (parts.length < 2) {
      throw new Error(`Invalid version string: ${versionStr}. Expected format X.Y`);
    }
    const [major, minor] = parts;
    if (isNaN(major) || isNaN(minor)) {
      throw new Error(`Invalid version string: ${versionStr}. Expected numeric values`);
    }
    return { major, minor };
  },
  compare(a, b) {
    if (typeof a !== 'string' && typeof a !== 'object') {
      throw new Error(`compare requires string or object, got ${typeof a}`);
    }
    if (typeof b !== 'string' && typeof b !== 'object') {
      throw new Error(`compare requires string or object, got ${typeof b}`);
    }
    const vA = typeof a === 'string' ? this.parse(a) : a;
    const vB = typeof b === 'string' ? this.parse(b) : b;
    if (vA.major !== vB.major) return vA.major - vB.major;
    return vA.minor - vB.minor;
  },
  sort(versions) {
    return [...versions].sort((a, b) => this.compare(a, b));
  }
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
  TEAM_DEFAULTS,
  TEAMS,
  TEAM_SERENITY,
  JQL_FILTERS,
  VersionUtils,
  UNGROUPED
};
