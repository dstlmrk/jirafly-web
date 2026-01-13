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

**First time setup:**
```bash
docker-compose build         # Build image
```

**Running:**
```bash
docker-compose up            # Start with hot reload
docker-compose down          # Stop
docker-compose logs -f       # View logs
```

**Hot reload:**
- Edit files in `src/` and changes are reflected immediately
- Nodemon automatically restarts the server
- No need to rebuild after code changes

## Architecture Overview

### Data Flow
1. **Frontend** (browser) → sends optional team + sprints to `/api/data`
2. **Server** (`src/server.js`) → validates params, calls JiraClient
3. **JiraClient** (`src/jira-client.js`) → fetches issues from Jira:
   - Fetches all teams (Serenity, Falcon, Discovery, Kosmik)
   - Paginates to find all historical sprints
   - Filters to current sprint + 1 future + N historical
4. **DataProcessor** (`src/data-processor.js`) → categorizes and aggregates issues
5. **Server** → returns processed JSON to frontend (all teams + per-team data)
6. **Frontend** → renders two Chart.js charts + detailed task table
7. **Frontend** → team toggle button to filter display

### Core Modules

**`src/jira-client.js`** - Jira API integration
- Uses Basic Auth (email + API token from `.env`)
- Supports both scoped tokens (with `JIRA_CLOUD_ID`) and unscoped tokens
- Token-based pagination (`/rest/api/3/search/jql` with `nextPageToken`)
- Retry logic with exponential backoff for rate limits and 5xx errors
- Always excludes Epic and Sub-task issue types via JQL
- **Sprint detection**: Parses end dates from sprint names, determines current sprint
- **Max future sprint**: Only includes current + 1 future sprint (configurable)
- **Paginated sprint analysis**: Fetches multiple pages to find historical sprints

**`src/data-processor.js`** - Issue categorization and aggregation
- **Categories** (in priority order):
  1. `Excluded` - has label RatioExcluded or Bughunting (excluded from percentage chart)
  2. `Maintenance` - has label Maintenance
  3. `Bug` - issue type is Bug
  4. `Product` - everything else (default)
- **Grouping**: By sprint using `customfield_10000` array, extracts X.Y version
- **Aggregation**: counts issues per category + sums HLE values (`customfield_11605`)
- **Table data**: Prepares detailed task list with HLE, tracked time, status

**`src/config.js`** - Centralized configuration
- All magic numbers, custom field IDs, category definitions, chart colors
- Team configurations (Serenity, Falcon, Discovery, Kosmik)
- Default sprint count: 6
- Custom field IDs:
  - `customfield_10000` - Sprint
  - `customfield_11605` - HLE (High Level Estimate)

**`src/html-template.js`** - Frontend generation
- Single-page app embedded in server response
- Two stacked bar charts using Chart.js (both include Average column):
  1. Percentage distribution by HLE (excludes Excluded category from 100%, Y-axis 0-100%)
  2. Absolute HLE values (shows effort distribution, includes all categories)
- Detailed task table with:
  - Sprint grouping (first occurrence only shown)
  - Assignee grouping within sprint
  - Color coding: red HLE=0, orange/red tracked time warnings
  - Fix version mismatch highlighting
  - Status badges (Done=green, In Review=yellow)
- Team toggle button (updates URL for sharing)
- JetBrains Mono font throughout

### URL Parameters

**Frontend parameters** (passed to browser):
- `team` - Filter by team (serenity, falcon, discovery, kosmik) - short names accepted
- `sprints` - Number of sprints to display

**API parameters** (`/api/data`):
- `sprints` - Override default sprint count (default: 6)

### Authentication Architecture

**Credentials are server-side only**:
- `.env` file contains `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, optionally `JIRA_CLOUD_ID`
- Frontend never sees credentials - only calls `/api/data` endpoint
- Server makes all Jira API calls with Basic Auth header
- `.env` is gitignored and should NEVER be committed

## Key Implementation Details

### Sprint Detection Logic
```javascript
// Parses end date from sprint name like "6.20.0 (20. 1. - 2. 2.)" or "6.19.0 (6. 1. - 19. 1.)"
parseSprintEndDate(sprintName) {
  // Note: [\d.\s]+ handles spaces in dates like "6. 1."
  const dateMatch = sprintName.match(/\([\d.\s]+\s*-\s*(\d+)\.\s*(\d+)\.?\s*\)/);
  // Returns Date object, handles year wrap-around
}

// Determines current sprint by finding closest end date to today
determineCurrentVersion(versionMap, sortedVersions) {
  // Scoring: prefer sprints ending within 0-21 days (current)
  // Fallback to third-to-last if date parsing fails
}
```

### Pagination for Sprint Analysis
```javascript
// Dynamic page count based on requested sprints (more sprints = more pages needed)
const maxPages = Math.max(5, Math.ceil(sprintCountToUse * 1.5));

// Fetches multiple pages to find all historical sprints
do {
  const response = await client.get('/rest/api/3/search/jql', { params });
  // Count unique sprints found
  // Continue until maxPages or no more data
} while (pageCount < maxPages && nextPageToken);
```

### Table Data Sorting
Issues are sorted by: sprint (descending) → assignee → key

### Color Coding
- **HLE = 0**: Red (missing estimate)
- **Tracked > 2x HLE**: Orange warning
- **Tracked > 3x HLE**: Red critical
- **Fix version != sprint**: Red text
- **Maintenance tasks**: Blue text
- **Excluded tasks**: Magenta text
- **Sprint dividers**: Dark gray lines between sprint groups

### Task Type Badges
- **Bug**: Red badge with white text
- **Analysis**: Dark gray badge with white text
- **Other types**: Light gray badge with black text

## Environment Variables

Required in `.env`:
```env
JIRA_URL=https://your-instance.atlassian.net/
JIRA_EMAIL=your.email@example.com
JIRA_API_TOKEN=your_api_token_here
PORT=3000                    # optional, defaults to 3000
JIRA_CLOUD_ID=abc123        # optional, only for scoped tokens
AUTH_USERNAME=admin          # optional, enables basic auth
AUTH_PASSWORD=secret         # optional, enables basic auth
```

## Common Gotchas

**Issue categorization is order-dependent**: First matching rule wins (Excluded > Maintenance > Bug > Product).

**Custom field IDs are instance-specific**: `customfield_10000` and `customfield_11605` may differ in other Jira instances.

**Sprint date parsing**: Dates in sprint names don't include year and may have spaces (e.g., "6. 1." for January 6). Regex uses `[\d.\s]+` to handle both formats. Code handles year wrap-around by checking if date would be >6 months in future.

**Pagination for sprint discovery**: First 100 issues might not contain all historical sprints. Code dynamically calculates max pages based on requested sprint count (1.5x sprints requested, minimum 5 pages).

**Max future sprint**: Only current + 1 future sprint included to avoid showing sprints too far ahead.

**HLE null handling**: Issues with null/undefined HLE values are treated as HLE=0 to prevent NaN aggregation bugs.

**Current sprint display**: Status bar shows current sprint version detected from sprint end dates.
