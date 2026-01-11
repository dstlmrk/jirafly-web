# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start server with auto-reload (nodemon)
npm start                # Production mode
```

### Testing
```bash
npm test                 # Run all tests
npm test:unit            # Run unit tests only
npm test:integration     # Run integration tests only
npm test:api             # Run API tests only
npm test:auth            # Run auth tests only

# Run individual test
node tests/api/fields.test.js
```

### Docker
```bash
docker-compose up --build    # Build and run
docker-compose up -d         # Run in background
docker-compose down          # Stop
docker-compose logs -f       # View logs
```

## Architecture Overview

### Data Flow
1. **Frontend** (browser) → sends filter_id + group_by to `/api/data`
2. **Server** (`src/server.js`) → validates params, calls JiraClient
3. **JiraClient** (`src/jira-client.js`) → fetches all issues from Jira filter using token-based pagination
4. **DataProcessor** (`src/data-processor.js`) → categorizes and aggregates issues
5. **Server** → returns processed JSON to frontend
6. **Frontend** → renders two Chart.js charts (percentage distribution + absolute HLE values)

### Core Modules

**`src/jira-client.js`** - Jira API integration
- Uses Basic Auth (email + API token from `.env`)
- Supports both scoped tokens (with `JIRA_CLOUD_ID`) and unscoped tokens
- Token-based pagination (`/rest/api/3/search/jql` with `nextPageToken`)
- Retry logic with exponential backoff for rate limits and 5xx errors
- Always excludes Epic issue types via JQL: `filter=X AND type != Epic`

**`src/data-processor.js`** - Issue categorization and aggregation
- **Categories** (in priority order):
  1. `Excluded` - has label RatioExcluded or Bughunting
  2. `Maintenance` - has label Maintenance or DevOps
  3. `Bug` - issue type is Bug
  4. `Product` - everything else (default)
- **Grouping**:
  - By fix version: uses `fields.fixVersions` array, takes latest version name
  - By sprint: uses `customfield_10000` array, takes latest sprint name
  - Extracts X.Y version number from name (e.g., "6.12.0 (16. 9. - 29. 9)" → "6.12")
- **Aggregation**: counts issues per category + sums HLE values (`customfield_11605`)

**`src/config.js`** - Centralized configuration
- All magic numbers, custom field IDs, category definitions, chart colors
- Frozen objects to prevent accidental mutation
- Custom field IDs:
  - `customfield_10000` - Sprint
  - `customfield_11605` - HLE (High Level Estimate)

**`src/html-template.js`** - Frontend generation
- Single-page app embedded in server response
- Two stacked bar charts using Chart.js:
  1. Percentage distribution (shows ratio of categories)
  2. Absolute HLE values (shows effort distribution)
- No separate frontend build step

### Authentication Architecture

**Credentials are server-side only**:
- `.env` file contains `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, optionally `JIRA_CLOUD_ID`
- Frontend never sees credentials - only calls `/api/data` endpoint
- Server makes all Jira API calls with Basic Auth header
- `.env` is gitignored and should NEVER be committed

**Token types**:
- Unscoped token: uses `JIRA_URL` directly (e.g., `https://company.atlassian.net`)
- Scoped token: requires `JIRA_CLOUD_ID`, uses `https://api.atlassian.com/ex/jira/{cloudId}`

### Test Organization

Tests are organized by purpose in `tests/` directory:
- **`unit/`** - Component tests (config, data-processor, html-template)
- **`integration/`** - Full workflow tests (search, filters, pagination)
- **`api/`** - Direct Jira API interaction tests
- **`auth/`** - Authentication and permission tests
- **`manual/`** - Ad-hoc debugging scripts

**Test utilities** (`src/test-utils.js`):
- `createJiraClient()` - Configured axios instance
- `jiraGet(endpoint, options)` - GET with error handling
- `logTestResult(name, success, message)` - Consistent output formatting

All tests require `.env` configuration. Tests are simple scripts (not using test framework like Jest/Mocha).

## Key Implementation Details

### Version Extraction Logic
Issues can belong to multiple versions/sprints. The app always picks the **latest** by name using natural sort:
```javascript
// From data-processor.js
function getLatestByName(items) {
  return items.reduce((latest, current) => {
    const comparison = latest.name.localeCompare(current.name, {numeric: true});
    return comparison >= 0 ? latest : current;
  }, null);
}
```

### Pagination Pattern
Jira API v3 uses token-based pagination (not offset-based):
```javascript
// From jira-client.js
let nextPageToken = null;
do {
  const response = await makeRequest(jql, nextPageToken, maxResults, 0);
  allIssues.push(...response.issues);
  nextPageToken = response.nextPageToken;
} while (nextPageToken && !response.isLast);
```

### Error Handling Strategy
- Network/timeout errors → retry with exponential backoff
- 429 rate limit → retry with backoff
- 5xx server errors → retry
- 401/403/404 → fail immediately with friendly message
- All errors use `ERROR_MESSAGES` mapping in `jira-client.js`

## Environment Variables

Required in `.env`:
```env
JIRA_URL=https://your-instance.atlassian.net/
JIRA_EMAIL=your.email@example.com
JIRA_API_TOKEN=your_api_token_here
PORT=3000                    # optional, defaults to 3000
JIRA_CLOUD_ID=abc123        # optional, only for scoped tokens
```

## Common Gotchas

**Issue categorization is order-dependent**: First matching rule wins (Excluded > Maintenance > Bug > Product). When modifying categories, preserve this priority order in `data-processor.js`.

**Custom field IDs are instance-specific**: `customfield_10000` and `customfield_11605` may differ in other Jira instances. These are defined in `src/config.js`.

**JQL filter requirement**: The app expects issues to come from a Jira filter (via filter ID). Direct JQL queries are not supported from the UI, though the underlying `makeRequest()` method accepts any JQL.

**Token vs Cloud ID confusion**: If using a scoped API token, you MUST set `JIRA_CLOUD_ID`. If using an unscoped token, leave `JIRA_CLOUD_ID` empty. The client automatically adjusts the base URL based on this.
