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

**History page** (`/`):
1. **Frontend** (browser) → sends optional team + sprints to `/api/data`
2. **Server** (`src/server.js`) → validates params, calls JiraClient
3. **JiraClient** (`src/jira-client.js`) → fetches issues from Jira:
   - Fetches all teams (Serenity, Falcon, Discovery, Kosmik)
   - Optimized pagination (2 pages for 6 sprints, stops early when enough found)
   - Filters to current sprint + N historical (no future sprints)
4. **DataProcessor** (`src/data-processor.js`) → categorizes and aggregates issues
5. **Server** → returns processed JSON to frontend (all teams + per-team data)
6. **Frontend** → renders two Chart.js charts + detailed task table
7. **Frontend** → team toggle button to filter display

**Next Sprint page** (`/next-sprint`):
1. **Frontend** → calls `/api/next-sprint`
2. **JiraClient** → fetches ALL issues from next sprint (includes Epics)
3. **DataProcessor** → prepares table data with WSJF, due date
4. **Frontend** → renders table with team toggle (default: "No team", can filter by team)

### Core Modules

**`src/jira-client.js`** - Jira API integration
- Uses Basic Auth (email + API token from `.env`)
- Supports both scoped tokens (with `JIRA_CLOUD_ID`) and unscoped tokens
- Token-based pagination (`/rest/api/3/search/jql` with `nextPageToken`)
- Retry logic with exponential backoff for rate limits and 5xx errors
- **Overview**: Excludes Epic and Sub-task issue types, no future sprints
- **Next sprint**: Includes Epics, fetches all issues from next sprint
- **Sprint detection**: Parses end dates from sprint names, determines current sprint
- **Sprint caching**: Caches sprint data to avoid refetching between pages
- **Optimized fetching**: Only fetches required fields (not `*all`), minimal pagination

**`src/data-processor.js`** - Issue categorization and aggregation
- **Categories** (in priority order):
  1. `Excluded` - has label RatioExcluded or Bughunting (excluded from percentage chart)
  2. `Maintenance` - has label Maintenance
  3. `Bug` - issue type is Bug
  4. `Product` - everything else (default)
- **Grouping**: By sprint using `customfield_10000` array, extracts X.Y version
- **Aggregation**: counts issues per category + sums HLE values (`customfield_11605`)
- **Table data**: `prepareTableData()` for Overview, `prepareUnassignedTableData()` for Next sprint
- **Date formatting**: `formatDueDate()` returns compact format (d.m.yyyy)

**`src/config.js`** - Centralized configuration
- All magic numbers, custom field IDs, category definitions, chart colors
- Team configurations (Serenity, Falcon, Discovery, Kosmik)
- Default sprint count: 6
- Custom field IDs:
  - `customfield_10000` - Sprint
  - `customfield_11605` - HLE (High Level Estimate)
  - `customfield_11737` - WSJF (Weighted Shortest Job First)

**`src/html-template.js`** - Frontend generation
- Single-page app embedded in server response
- **Tab navigation**: Overview and Next sprint pages
- **Data caching**: Caches API responses, no refetch on tab switch
- **Overview page**:
  - Two stacked bar charts using Chart.js (both include Average column)
  - Percentage distribution by HLE (excludes Excluded category from 100%)
  - Absolute HLE values (shows effort distribution)
  - Detailed task table with sprint/assignee grouping
  - Team toggle button (updates URL for sharing)
- **Next sprint page**:
  - Two stacked bar charts by team (excludes Epics in calculations)
  - Percentage distribution and absolute HLE values
  - Table with all tasks from next sprint
  - Team toggle button (default: "No team", can filter by team)
  - HLE toggle to show/hide HLE column (persisted in sessionStorage)
  - Columns: Assignee, WSJF, Task, HLE (toggleable), Due Date, Status
  - Due date badges with red color coding
  - Category-based title coloring
- Dark mode toggle
- JetBrains Mono font throughout

### URL Parameters

**Routes**:
- `/` - Overview page (task distribution analysis)
- `/next-sprint` - Next sprint page (all tasks from next sprint)

**Frontend parameters** (Overview page only):
- `team` - Filter by team (serenity, falcon, discovery, kosmik) - short names accepted
- `sprints` - Number of sprints to display (default: 6)

**API parameters**:
- `/api/data?sprints=N` - Override default sprint count (default: 6)
- `/api/next-sprint` - Returns all tasks from next sprint with team info

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

### Optimized Pagination for Sprint Analysis
```javascript
// Default 6 sprints: max 2 pages (200 issues)
// Larger requests scale up proportionally
const basePages = 2;
const maxPages = sprintCountToUse <= 6 ? basePages : Math.ceil(sprintCountToUse / 3);

// Stop early if enough sprints found
if (foundSprintCount >= minSprintsNeeded) {
  console.log(`Found enough sprints, stopping pagination`);
  break;
}
```

### Optimized Field Fetching
```javascript
// Only fetch fields we actually need (much faster than '*all')
const REQUIRED_FIELDS = [
  'summary', 'issuetype', 'status', 'assignee', 'labels',
  'fixVersions', 'timetracking',
  'customfield_10000',  // Sprint
  'customfield_11605'   // HLE
].join(',');
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
- **Epic**: Purple badge with white text
- **Analysis**: Dark gray badge with white text
- **Other types**: Light gray badge with black text

### Due Date Badges (Next Sprint)
- **Normal**: Gray badge
- **Overdue or upcoming**: Red badge

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

**Optimized pagination**: Default 2 pages (200 issues) for 6 sprints. Stops early when enough sprints found. Scales up for larger sprint requests.

**Overview page**: Only current + past sprints shown (no future sprints).

**Next sprint page**: Shows all tasks from next sprint, filterable by team (default: "No team").

**HLE null handling**: Issues with null/undefined HLE values are treated as HLE=0 to prevent NaN aggregation bugs.

**Current sprint display**: Status bar shows current sprint version detected from sprint end dates.

**Data caching**: Frontend caches API responses - switching tabs doesn't refetch data, only page refresh does.
