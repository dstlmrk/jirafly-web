# Jirafly Web

Web application for analyzing Jira task distribution across teams by categories and sprints.

## Description

Jirafly automatically fetches tasks from Jira projects, categorizes them (Excluded, Maintenance, Bug, Product) and displays their distribution in two interactive charts + a detailed task table.

### Project Toggle (BE/FE)

The application supports two project modes:
- **BE** (Backend) - fetches from KNJ project, shows 4 teams (Serenity, Falcon, Discovery, Kosmik)
- **FE** (Frontend) - fetches from SS project, single team (no team toggle)

Use the **BE/FE button** in the top right to switch between projects. The selection is preserved in URL (`?project=fe`) for sharing.

### Three Pages

**Overview** (`/`) - Task distribution analysis:
1. **Percentage Distribution** - category ratio per sprint + average (by HLE)
2. **Absolute HLE Values** - High Level Estimate sums by category + average
3. **Detailed Table** - list of all tasks with HLE, tracked time, status

**Planning** (`/planning`) - Next sprint planning:
- All tasks from next sprint with team filtering (default: "No team")
- Two charts showing distribution by team (excludes Epics)
- Columns: Assignee, WSJF, Task, HLE (toggleable), Due Date, Status
- Due date badges with color coding (overdue = red)

**Future Sprints** (`/next-sprints`) - Forward planning:
- Tasks from 6 future sprints (both BE and FE projects)
- Two charts showing percentage and HLE distribution by sprint
- BE/FE toggle to switch between projects
- Columns: Sprint, Assignee, WSJF, Task, HLE, Due Date, Status
- Sprint grouping with visual separators

## Key Features

- **Three-page navigation** - tab-style switching between Overview, Planning, and Future Sprints
- **Project toggle (BE/FE)** - switch between Backend (KNJ) and Frontend (SS) projects
- **Multi-team support** - Serenity, Falcon, Discovery, Kosmik (BE mode only)
- **Team toggle** - switch between teams (URL parameter for sharing)
- **Configurable sprint count** - URL parameter `sprints`
- **Smart sprint detection** - automatically detects current sprint by end date
- **Data caching** - no refetch when switching tabs or projects (cached per mode)
- **Color coding** - zero HLE (red), exceeded time (orange/red), category colors
- **Interactive charts** - Chart.js with tooltips and legend
- **Dark mode** - toggle between light and dark themes
- **Hot reload** - instant changes during development

## Requirements

- **Node.js** 18.0.0 or higher (for local development)
- **Docker** 20.10+ (recommended)
- **Jira API Token** - generate in Jira settings
- **Jira Email** - email linked to Jira account

## Quick Start

### With Docker (recommended)

1. **Configure `.env` file**:
   ```env
   JIRA_URL=https://your-instance.atlassian.net/
   JIRA_EMAIL=your.email@example.com
   JIRA_API_TOKEN=your_api_token_here
   PORT=3000
   AUTH_USERNAME=admin        # optional - basic auth
   AUTH_PASSWORD=secret       # optional - basic auth
   ```

2. **Run the application**:
   ```bash
   docker-compose build
   docker-compose up
   ```

3. **Open browser**: `http://localhost:3000`

### Without Docker

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure `.env`** (see above)

3. **Run dev server**:
   ```bash
   npm run dev
   ```

4. **Open browser**: `http://localhost:3000`

## Usage

### Basic Usage

1. Open `http://localhost:3000`
2. Data loads automatically (all teams, 6 sprints)
3. Use the **button in top right** to switch between teams

### URL Parameters

```
http://localhost:3000/                        # Overview - BE mode, All teams, 6 sprints
http://localhost:3000/?project=fe             # Overview - FE mode (SS project)
http://localhost:3000/?team=serenity          # Overview - Serenity only
http://localhost:3000/?sprints=10             # Overview - 10 sprints
http://localhost:3000/?team=falcon&sprints=4  # Overview - Falcon, 4 sprints
http://localhost:3000/planning                # Planning - all tasks from next sprint
http://localhost:3000/next-sprints            # Future Sprints - 6 future sprints (BE + FE)
http://localhost:3000/next-sprints?project=fe # Future Sprints - FE mode
```

**Parameters** (Overview page only):
- `project` - project mode (`fe` for Frontend/SS, default: Backend/KNJ)
- `team` - filter by team (serenity, falcon, discovery, kosmik) - BE mode only
- `sprints` - number of sprints (default: 6)

## Task Categories

The application sorts tasks into 4 categories (in priority order):

1. **Excluded** (magenta) - has label `RatioExcluded` or `Bughunting`
2. **Maintenance** (blue) - has label `Maintenance`
3. **Bug** (red) - issue type is `Bug`
4. **Product** (green) - everything else (default)

**First match wins!** If a task has Maintenance label and is also type Bug, it's categorized as Maintenance.

**Note**: Excluded tasks are not counted in percentage chart (100% = Maintenance + Bug + Product).

## Task Tables

### Overview Table

The table displays:
- **Sprint** - sprint number (grouped, separated by gray line)
- **Assignee** - assigned person (grouped within sprint)
- **Task** - type badge, key and title (truncated to 80 chars)
- **HLE** - High Level Estimate (red 0 = missing estimate)
- **Tracked** - logged time (orange >2x HLE, red >3x HLE)
- **Fix Version** - version (red if doesn't match sprint)
- **Status** - task status (green Done/Merged, yellow In Review)

### Next Sprint Table

The table displays:
- **Assignee** - assigned person (grouped)
- **WSJF** - Weighted Shortest Job First priority
- **Task** - type badge, key and title (colored by category)
- **HLE** - High Level Estimate (toggleable, red 0 = missing estimate)
- **Due Date** - deadline badge (red = overdue or upcoming)
- **Status** - task status

**Type badge colors**:
- Bug - red badge
- Epic - purple badge
- Analysis - dark gray badge
- Other - light gray badge

**Title colors** (both tables):
- Maintenance tasks - blue text
- Excluded tasks - magenta text

## Docker

```bash
# First run
docker-compose build
docker-compose up

# Subsequent runs
docker-compose up

# Stop
docker-compose down

# Logs
docker-compose logs -f
```

## API Endpoints

### `GET /`
Returns HTML page with Overview view

### `GET /planning`
Returns HTML page with Planning view (next sprint)

### `GET /next-sprints`
Returns HTML page with Future Sprints view

### `GET /api/data`
Fetches and processes tasks for all teams (Overview page)

**Parameters**:
- `project` (string, optional) - `fe` for Frontend/SS project (default: Backend/KNJ)
- `sprints` (number, optional) - number of sprints (default: 6)

### `GET /api/next-sprint`
Fetches all tasks from next sprint with team info (Planning page)

**Response**:
- `beIssues` - array of BE tasks with WSJF, HLE, due date, team, assignee
- `feIssues` - array of FE tasks
- `beNextVersion` / `feNextVersion` - next sprint versions
- `totalBeIssues` / `totalFeIssues` - total counts
- `teams` - available team labels

### `GET /api/next-sprints`
Fetches all tasks from 6 future sprints (Future Sprints page)

**Response**:
- `beIssues` - array of BE tasks with sprint, WSJF, HLE, due date
- `feIssues` - array of FE tasks
- `beFutureVersions` / `feFutureVersions` - list of future sprint versions
- `beCurrentVersion` / `feCurrentVersion` - current sprint versions
- `totalBeIssues` / `totalFeIssues` - total counts
- `teams` - available team labels

### `GET /health`
Health check endpoint

## Security

- `.env` is in `.gitignore` - won't be committed
- Frontend only calls `/api/data` endpoint
- Server uses Basic Auth for Jira API
- No credentials in error messages

## Project Structure

```
jirafly-web/
├── src/
│   ├── server.js           # Express server + API endpoints
│   ├── jira-client.js      # Jira API, sprint detection, optimized pagination
│   ├── data-processor.js   # Categorization and aggregation
│   ├── html-template.js    # Frontend with Chart.js + table
│   └── config.js           # Configuration (field IDs, colors, teams)
├── tests/                  # Tests
├── Dockerfile              # Docker image
├── docker-compose.yml      # Docker Compose
├── .env                    # CREDENTIALS - GITIGNORED!
├── CLAUDE.md               # Technical documentation
└── README.md
```

## Technology

- **Backend**: Node.js 20, Express.js
- **Frontend**: Vanilla JavaScript, Chart.js 4.x
- **Jira API**: REST API v3 (Basic Auth)
- **Docker**: Alpine Linux

## License

ISC
