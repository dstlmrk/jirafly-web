/**
 * HTML template generator for Jirafly web interface
 * Generates complete HTML page with Chart.js visualizations
 */

const { CHART_COLORS } = require('./config');

const CSS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-primary: #fafafa;
    --bg-secondary: #fff;
    --bg-tertiary: #f5f5f5;
    --bg-hover: #fafafa;
    --text-primary: #000;
    --text-secondary: #666;
    --text-muted: #333;
    --border-color: #e0e0e0;
    --border-light: #f0f0f0;
    --btn-bg: #000;
    --btn-text: #fff;
    --btn-hover: #333;
    --link-color: #4b5563;
    --link-hover: #0066cc;
    --row-zero-bg: #fef2f2;
    --row-zero-hover: #fee2e2;
  }

  body.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #242424;
    --bg-tertiary: #2a2a2a;
    --bg-hover: #2f2f2f;
    --text-primary: #e5e5e5;
    --text-secondary: #999;
    --text-muted: #ccc;
    --border-color: #3a3a3a;
    --border-light: #333;
    --btn-bg: #e5e5e5;
    --btn-text: #1a1a1a;
    --btn-hover: #d0d0d0;
    --link-color: #9ca3af;
    --link-hover: #60a5fa;
    --row-zero-bg: #2d1f1f;
    --row-zero-hover: #3d2525;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'JetBrains Mono', monospace;
    background: var(--bg-primary);
    min-height: 100vh;
    padding: 40px 20px;
    color: var(--text-primary);
    transition: background 0.2s, color 0.2s;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .header-left {
    flex: 1;
  }

  h1 {
    color: var(--text-primary);
    margin-bottom: 8px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 400;
  }

  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .header-filter {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    height: 41px;
    padding: 0 32px 0 12px;
    background-color: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    cursor: pointer;
    width: 180px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  body.dark .header-filter {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231a1a1a' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  }

  .header-filter:hover {
    background-color: var(--btn-hover);
  }

  .header-filter:focus {
    outline: none;
  }

  .header-filter:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .group-toggle {
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    padding: 12px 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: background 0.2s;
    width: 160px;
    text-align: center;
  }

  .group-toggle:hover {
    background: var(--btn-hover);
  }

  .group-toggle:active {
    opacity: 0.8;
  }

  .group-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mode-toggle {
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    width: 41px;
    height: 41px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
  }

  .mode-toggle:hover:not(:disabled) {
    background: var(--btn-hover);
  }

  .mode-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-toggle {
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    width: 41px;
    height: 41px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .theme-toggle:hover {
    background: var(--btn-hover);
  }

  .theme-toggle svg {
    width: 19px;
    height: 19px;
  }

  .github-link {
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    width: 41px;
    height: 41px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    text-decoration: none;
  }

  .github-link:hover {
    background: var(--btn-hover);
  }

  .github-link svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  #status {
    padding: 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    margin-bottom: 32px;
    color: var(--text-primary);
    font-weight: 400;
    font-size: 13px;
    transition: background 0.2s, border-color 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #status.loading {
    border-color: var(--text-secondary);
  }

  #status.error {
    border-color: var(--text-primary);
    color: #ef4444;
  }

  .status-sprint-info {
    color: var(--text-primary);
    font-size: 13px;
  }

  .charts-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    margin-top: 32px;
  }

  @media (min-width: 1200px) {
    .charts-container {
      grid-template-columns: 1fr 1fr;
    }
  }

  .chart-wrapper {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 24px;
    transition: background 0.2s, border-color 0.2s;
  }

  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .chart-canvas {
    max-height: 400px;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--text-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .table-wrapper {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 24px;
    margin-top: 32px;
    transition: background 0.2s, border-color 0.2s;
  }

  .table-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .issues-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    line-height: 1.5;
  }

  .issues-table thead {
    background: var(--bg-tertiary);
    border-bottom: 2px solid var(--border-color);
  }

  .issues-table th {
    text-align: left;
    padding: 10px 8px;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 10px;
  }

  .issues-table td {
    padding: 8px;
    border-bottom: 1px solid var(--border-light);
    vertical-align: top;
  }

  .issues-table tbody tr:hover {
    background: var(--bg-hover);
  }

  .issues-table tbody tr.sprint-start {
    border-top: 2px solid var(--text-secondary);
  }

  .issues-table tbody tr.sprint-start td {
    padding-top: 16px;
  }

  .issues-table .version-mismatch {
    color: #dc2626;
    font-weight: 700;
  }

  .issues-table .sprint-badge {
    display: inline-block;
    background: var(--btn-bg);
    color: var(--btn-text);
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
  }

  .issues-table .col-sprint {
    width: 60px;
    font-weight: 500;
  }

  .sprint-section {
    margin-bottom: 32px;
  }

  .sprint-section:last-child {
    margin-bottom: 0;
  }

  .sprint-header {
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: #000;
    margin-bottom: 12px;
    padding: 6px 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  body.dark .sprint-header {
    background: #e5e5e5;
    color: #1a1a1a;
  }

  .issues-table .col-assignee {
    width: 140px;
  }

  .issues-table .col-task {
    min-width: 300px;
  }

  .issues-table .col-hle {
    width: 60px;
    text-align: right;
  }

  .issues-table .col-time {
    width: 110px;
    text-align: right;
    white-space: nowrap;
  }

  .issues-table .col-version {
    width: 60px;
  }

  .issues-table .col-status {
    width: 120px;
    white-space: nowrap;
  }

  .issues-table .task-type {
    display: inline-block;
    background: #d1d5db;
    color: #000;
    padding: 3px 7px;
    font-weight: 700;
    margin-right: 6px;
    border-radius: 3px;
    font-size: 11px;
  }

  body.dark .issues-table .task-type {
    background: #4b5563;
    color: #fff;
  }

  .issues-table .task-type-bug {
    background: #dc2626;
    color: #fff;
  }

  body.dark .issues-table .task-type-bug {
    background: #ef4444;
    color: #fff;
  }

  .issues-table .task-type-analysis {
    background: #4b5563;
    color: #fff;
  }

  body.dark .issues-table .task-type-analysis {
    background: #9ca3af;
    color: #1a1a1a;
  }

  .issues-table .task-key {
    text-decoration: none;
    font-weight: 500;
    color: var(--link-color);
  }

  .issues-table .task-key:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }

  .issues-table .task-summary {
    color: var(--text-muted);
  }

  .issues-table .task-summary-maintenance {
    color: #1d4ed8;
  }

  body.dark .issues-table .task-summary-maintenance {
    color: #93c5fd;
  }

  .issues-table .task-summary-excluded {
    color: #be185d;
  }

  body.dark .issues-table .task-summary-excluded {
    color: #f9a8d4;
  }

  .issues-table .status-label {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    background: #e5e7eb;
    color: #000;
  }

  body.dark .issues-table .status-label {
    background: #4b5563;
    color: #e5e5e5;
  }

  .issues-table .status-done {
    background: #dcfce7;
    color: #16a34a;
  }

  body.dark .issues-table .status-done {
    background: #14532d;
    color: #86efac;
  }

  .issues-table .status-review {
    background: #fef3c7;
    color: #ca8a04;
  }

  body.dark .issues-table .status-review {
    background: #713f12;
    color: #fde047;
  }

  .issues-table .time-warning {
    color: #d97706;
    font-weight: 700;
  }

  .issues-table .time-critical {
    color: #dc2626;
    font-weight: 700;
  }

  .issues-table .hle-zero {
    color: #dc2626;
    font-weight: 700;
  }

  .issues-table tbody tr.row-hle-zero {
    background: var(--row-zero-bg);
  }

  .issues-table tbody tr.row-hle-zero:hover {
    background: var(--row-zero-hover);
  }

  .issues-table .empty-cell {
    color: var(--text-secondary);
  }

  /* Navigation tabs */
  .nav-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 24px;
    border-bottom: 2px solid var(--border-color);
  }

  .nav-tab {
    background: transparent;
    color: var(--text-secondary);
    border: none;
    padding: 12px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s, border-color 0.2s;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }

  .nav-tab:hover {
    color: var(--text-primary);
  }

  .nav-tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--text-primary);
    font-weight: 600;
  }

  /* Unassigned page specific styles */
  .issues-table .col-wsjf {
    width: 60px;
    text-align: right;
  }

  .issues-table .col-due {
    width: 100px;
    white-space: nowrap;
  }

  .issues-table .due-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #fee2e2;
    color: #dc2626;
  }

  body.dark .issues-table .due-badge {
    background: #7f1d1d;
    color: #fca5a5;
  }

  .issues-table .task-type-epic {
    background: #7c3aed;
    color: #fff;
  }

  body.dark .issues-table .task-type-epic {
    background: #8b5cf6;
    color: #fff;
  }

  .table-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .table-header-row .table-title {
    margin-bottom: 0;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
  }

  .toggle-label input[type="checkbox"] {
    display: none;
  }

  .toggle-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--border-color);
    border-radius: 10px;
    transition: background 0.2s;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-label input:checked + .toggle-switch {
    background: var(--btn-bg);
  }

  .toggle-label input:checked + .toggle-switch::after {
    transform: translateX(16px);
  }

  body.dark .toggle-switch::after {
    background: #1a1a1a;
  }

  body.dark .toggle-label input:checked + .toggle-switch::after {
    background: #1a1a1a;
  }

  .assignee-filter {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .assignee-filter label {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .assignee-filter select {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    cursor: pointer;
    min-width: 140px;
  }

  .assignee-filter select:hover {
    border-color: var(--text-secondary);
  }

  .assignee-filter select:focus {
    outline: none;
    border-color: var(--text-primary);
  }

  .table-header-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .issues-table .col-hle.hidden,
  .issues-table th.col-hle.hidden,
  .issues-table td.col-hle.hidden {
    display: none;
  }

  .charts-note {
    text-align: right;
    color: var(--text-secondary);
    font-size: 11px;
    margin-top: 8px;
    margin-bottom: 0;
  }
`;

function generateHTML(options) {
  if (!options || !options.jiraUrl) {
    throw new Error('generateHTML requires options.jiraUrl');
  }
  const jiraBrowseUrl = options.jiraUrl.replace(/\/$/, '') + '/browse/';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jirafly Web 🪰</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1"></script>
  <style>${CSS_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>Jirafly Web 🪰</h1>
        <p class="subtitle">Making Jira slightly less painful</p>
      </div>
      <div class="header-buttons">
        <button id="modeToggle" class="mode-toggle" title="Toggle BE/FE mode">BE</button>
        <select id="teamToggle" class="header-filter" disabled>
          <option value="All">All teams</option>
        </select>
        <select id="overviewAssigneeFilter" class="header-filter" disabled>
          <option value="">All members</option>
        </select>
        <button id="themeToggle" class="theme-toggle" title="Toggle dark mode">
          <svg id="moonIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <svg id="sunIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
        <a href="https://github.com/dstlmrk/jirafly-web" target="_blank" class="github-link" title="View on GitHub">
          <svg viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="nav-tabs">
      <button id="tabHistory" class="nav-tab active" data-page="history">Overview</button>
      <button id="tabPlanning" class="nav-tab" data-page="planning">Planning</button>
      <button id="tabFutureSprints" class="nav-tab" data-page="next-sprints">Future sprints</button>
    </div>

    <div id="status">Initializing...</div>

    <div class="charts-container" id="chartsContainer" style="display: none;">
      <div class="chart-wrapper">
        <div class="chart-title">Percentage Distribution by Category</div>
        <canvas id="percentageChart" class="chart-canvas"></canvas>
      </div>

      <div class="chart-wrapper">
        <div class="chart-title">Absolute HLE Values by Category</div>
        <canvas id="hleChart" class="chart-canvas"></canvas>
      </div>
    </div>

    <div class="table-wrapper" id="tableWrapper" style="display: none;">
      <div class="table-title" id="tableTitle">Detailed Task List</div>
      <div id="issuesTableContainer"></div>
    </div>

    <div class="charts-container" id="nextSprintChartsContainer" style="display: none;">
      <div class="chart-wrapper">
        <div class="chart-title">Percentage Distribution by Category <span class="charts-note">(excludes Epics)</span></div>
        <canvas id="nextSprintPercentageChart" class="chart-canvas"></canvas>
      </div>

      <div class="chart-wrapper">
        <div class="chart-title">Absolute HLE Values by Category <span class="charts-note">(excludes Epics)</span></div>
        <canvas id="nextSprintHleChart" class="chart-canvas"></canvas>
      </div>
    </div>

    <div class="table-wrapper" id="unassignedTableWrapper" style="display: none;">
      <div class="table-header-row">
        <div class="table-title" id="unassignedTableTitle">Tasks Without Team</div>
        <div class="table-header-controls">
          <div class="assignee-filter">
            <label for="planningAssigneeFilter">Assignee:</label>
            <select id="planningAssigneeFilter">
              <option value="">All members</option>
            </select>
          </div>
          <label class="toggle-label">
            <input type="checkbox" id="hleToggle" checked>
            <span class="toggle-switch"></span>
            <span>Show HLE</span>
          </label>
        </div>
      </div>
      <table class="issues-table" id="unassignedTable">
        <thead>
          <tr>
            <th class="col-assignee">Assignee</th>
            <th class="col-wsjf">WSJF</th>
            <th class="col-task">Task</th>
            <th class="col-hle">HLE</th>
            <th class="col-due">Due Date</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody id="unassignedTableBody">
        </tbody>
      </table>
    </div>

    <div class="charts-container" id="futureSprintsChartsContainer" style="display: none;">
      <div class="chart-wrapper">
        <div class="chart-title">Percentage Distribution by Category</div>
        <canvas id="futureSprintsPercentageChart" class="chart-canvas"></canvas>
      </div>

      <div class="chart-wrapper">
        <div class="chart-title">Absolute HLE Values by Category</div>
        <canvas id="futureSprintsHleChart" class="chart-canvas"></canvas>
      </div>
    </div>

    <div class="table-wrapper" id="futureSprintsTableWrapper" style="display: none;">
      <div class="table-header-row">
        <div class="table-title" id="futureSprintsTableTitle">Future Sprints Tasks</div>
        <div class="assignee-filter">
          <label for="futureSprintsAssigneeFilter">Assignee:</label>
          <select id="futureSprintsAssigneeFilter">
            <option value="">All members</option>
          </select>
        </div>
      </div>
      <div id="futureSprintsTableContainer"></div>
    </div>

    </div>

  <script>
    let percentageChart = null;
    let hleChart = null;
    let nextSprintPercentageChart = null;
    let nextSprintHleChart = null;
    let futureSprintsPercentageChart = null;
    let futureSprintsHleChart = null;
    let allData = null; // Store all data for client-side filtering
    let beDataCache = null; // Cache for BE mode data
    let feDataCache = null; // Cache for FE mode data
    let rawIssues = []; // Store raw issues
    let currentTeam = 'All'; // Current selected team for history page
    let availableTeams = ['All']; // Available teams for history page
    let currentPage = 'history'; // Current page: 'history', 'planning', or 'next-sprints'
    let nextSprintData = null; // Cache for next sprint data
    let currentNextSprintTeam = 'NoTeam'; // Current selected team for planning page
    let availableNextSprintTeams = ['NoTeam']; // Available teams for planning page
    let currentMode = 'be'; // Current mode: 'be' or 'fe'
    let futureSprintsData = null; // Cache for future sprints data (contains both BE and FE)
    let overviewAssigneeFilter = ''; // Selected assignee for overview page
    let planningAssigneeFilter = ''; // Selected assignee for planning page
    let futureSprintsAssigneeFilter = ''; // Selected assignee for future sprints page

    const COLORS = ${JSON.stringify(CHART_COLORS)};
    const JIRA_BROWSE_URL = '${jiraBrowseUrl}';

    // Page navigation functions
    function getPageFromURL() {
      const path = window.location.pathname;
      if (path === '/planning') {
        return 'planning';
      }
      if (path === '/next-sprints') {
        return 'next-sprints';
      }
      return 'history';
    }

    function switchPage(page) {
      currentPage = page;

      // Update URL using path, preserve mode param for history page
      let newPath = page === 'history' ? '/' : '/' + page;
      if (page === 'history' && currentMode === 'fe') {
        newPath = '/?project=fe';
      }
      if (page === 'next-sprints' && currentMode === 'fe') {
        newPath = '/next-sprints?project=fe';
      }
      window.history.pushState({}, '', newPath);

      // Update tabs
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === page);
      });

      // Sync team selection from sessionStorage
      const savedTeam = sessionStorage.getItem('jirafly-selected-team');
      if (savedTeam) {
        if (page === 'planning' && availableNextSprintTeams.includes(savedTeam)) {
          currentNextSprintTeam = savedTeam;
        } else if (page === 'history' && availableTeams.includes(savedTeam)) {
          currentTeam = savedTeam;
        }
      }

      // Update team button based on page
      const teamButton = document.getElementById('teamToggle');
      if (page === 'planning') {
        teamButton.disabled = !nextSprintData;
        updateNextSprintTeamButton(currentNextSprintTeam);
      } else if (page === 'next-sprints') {
        // Hide team toggle on future sprints page
        teamButton.style.display = 'none';
      } else {
        teamButton.disabled = !allData || currentMode === 'fe';
        updateTeamButton(currentTeam);
      }

      // Show/hide content based on page
      updatePageContent();
    }

    function updatePageContent() {
      const chartsContainer = document.getElementById('chartsContainer');
      const tableWrapper = document.getElementById('tableWrapper');
      const nextSprintChartsContainer = document.getElementById('nextSprintChartsContainer');
      const nextSprintTableWrapper = document.getElementById('unassignedTableWrapper');
      const futureSprintsChartsContainer = document.getElementById('futureSprintsChartsContainer');
      const futureSprintsTableWrapper = document.getElementById('futureSprintsTableWrapper');
      const statusEl = document.getElementById('status');

      // Hide all content first
      chartsContainer.style.display = 'none';
      tableWrapper.style.display = 'none';
      nextSprintChartsContainer.style.display = 'none';
      nextSprintTableWrapper.style.display = 'none';
      futureSprintsChartsContainer.style.display = 'none';
      futureSprintsTableWrapper.style.display = 'none';

      if (currentPage === 'history') {
        // Show and enable mode toggle, update visibility
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.style.display = '';
        modeToggle.disabled = false;
        updateModeButton();
        updateTeamButtonVisibility();
        updateOverviewAssigneeFilterVisibility();

        // Get cached data for current mode
        const cachedData = currentMode === 'be' ? beDataCache : feDataCache;

        // Load history data if not cached for current mode
        if (!cachedData) {
          // Clear and disable assignee filter while loading
          const assigneeFilter = document.getElementById('overviewAssigneeFilter');
          assigneeFilter.innerHTML = '<option value="">All members</option>';
          assigneeFilter.disabled = true;
          loadData();
        } else {
          // Use mode-specific cache
          allData = cachedData;

          // Update available teams from cached data
          if (allData.teams && allData.teams.length > 0) {
            availableTeams = ['All', ...allData.teams];
          } else {
            availableTeams = ['All'];
          }
          // Populate team filter dropdown
          populateTeamFilter(allData.teams || [], currentTeam);

          // Show cached data - always re-render with current team (may have changed)
          const teamData = getDataForTeam(currentTeam);
          renderCharts(teamData);
          renderTable(teamData.tableData);
          chartsContainer.style.display = 'grid';
          tableWrapper.style.display = 'block';

          // Update status with sprint info on right
          const sprintInfo = allData.sprintCount ? \` from the last \${allData.sprintCount} sprints\` : '';
          const leftText = \`Loaded \${allData.all.totalIssues} tasks\${sprintInfo}\`;

          let rightText = '';
          if (allData.currentVersion) {
            rightText = \`Now is \${allData.currentVersion}\`;
            if (allData.sprintDates) {
              rightText += \` (\${allData.sprintDates.startDate} - \${allData.sprintDates.endDate})\`;
            }
          }

          if (rightText) {
            statusEl.innerHTML = \`<span>\${leftText}</span><span class="status-sprint-info">\${rightText}</span>\`;
          } else {
            statusEl.textContent = leftText;
          }
        }
      } else if (currentPage === 'planning') {
        // Show and enable mode toggle on planning page
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.style.display = '';
        modeToggle.disabled = false;
        modeToggle.textContent = currentMode.toUpperCase();
        // In FE mode, show disabled team toggle with "No team"
        const teamSelect = document.getElementById('teamToggle');
        if (currentMode === 'fe') {
          teamSelect.innerHTML = '<option value="NoTeam">No team</option>';
          teamSelect.disabled = true;
        }
        teamSelect.style.display = '';
        // Hide overview assignee filter
        document.getElementById('overviewAssigneeFilter').style.display = 'none';

        // Load next-sprint data if not cached
        if (!nextSprintData) {
          loadNextSprintData();
        } else {
          // Show cached data - always re-render with current team (may have changed)
          renderNextSprintCharts();
          const filteredData = getNextSprintDataForTeam(currentNextSprintTeam);
          renderNextSprintTable(filteredData);
          nextSprintChartsContainer.style.display = 'grid';
          nextSprintTableWrapper.style.display = 'block';
          updateNextSprintStatus();
        }
      } else if (currentPage === 'next-sprints') {
        // Show and enable mode toggle on future sprints page
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.style.display = '';
        modeToggle.disabled = false;
        modeToggle.textContent = currentMode.toUpperCase();
        // Show disabled team toggle on future sprints page
        const teamSelect = document.getElementById('teamToggle');
        teamSelect.innerHTML = '<option value="All">All teams</option>';
        teamSelect.disabled = true;
        teamSelect.style.display = '';
        // Hide overview assignee filter
        document.getElementById('overviewAssigneeFilter').style.display = 'none';

        // Load future sprints data if not cached
        if (!futureSprintsData) {
          loadFutureSprintsData();
        } else {
          // Use cached data - just re-render for current mode
          renderFutureSprintsCharts();
          const tableData = getFutureSprintsTableData();
          renderFutureSprintsTable(tableData);
          futureSprintsChartsContainer.style.display = 'grid';
          futureSprintsTableWrapper.style.display = 'block';
          updateFutureSprintsStatus();
        }
      }
    }

    // Assignee filter functions
    function getUniqueAssignees(tableData) {
      const assignees = new Set();
      tableData.forEach(row => {
        if (row.assignee) {
          assignees.add(row.assignee);
        }
      });
      return Array.from(assignees).sort((a, b) => a.localeCompare(b));
    }

    function populateAssigneeFilter(selectId, assignees, selectedValue) {
      const select = document.getElementById(selectId);
      if (!select) return;

      // Clear existing options except the first one
      select.innerHTML = '<option value="">All members</option>';

      // Add assignee options
      assignees.forEach(assignee => {
        const option = document.createElement('option');
        option.value = assignee;
        option.textContent = assignee;
        if (assignee === selectedValue) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    function handleOverviewAssigneeFilter() {
      overviewAssigneeFilter = document.getElementById('overviewAssigneeFilter').value;
      const teamData = getDataForTeam(currentTeam);
      if (teamData) {
        renderTable(teamData.tableData);
      }
    }

    function handlePlanningAssigneeFilter() {
      planningAssigneeFilter = document.getElementById('planningAssigneeFilter').value;
      const filteredData = getNextSprintDataForTeam(currentNextSprintTeam);
      renderNextSprintTable(filteredData);
    }

    function handleFutureSprintsAssigneeFilter() {
      futureSprintsAssigneeFilter = document.getElementById('futureSprintsAssigneeFilter').value;
      const tableData = getFutureSprintsTableData();
      renderFutureSprintsTable(tableData);
    }

    async function loadNextSprintData() {
      const statusEl = document.getElementById('status');
      statusEl.className = 'loading';
      statusEl.innerHTML = '<span><span class="spinner"></span>Loading tasks for next sprint...</span>';

      try {
        const response = await fetch('/api/next-sprint');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load data');
        }

        nextSprintData = await response.json();

        // Check if user switched to different page during loading
        if (currentPage !== 'planning') {
          return;
        }

        // Set available teams for next sprint (NoTeam + actual teams)
        if (nextSprintData.teams && nextSprintData.teams.length > 0) {
          availableNextSprintTeams = ['NoTeam', ...nextSprintData.teams];
        }

        // Apply team from URL param > sessionStorage > default 'NoTeam'
        const { team: urlTeam } = getURLParams();
        const savedTeam = sessionStorage.getItem('jirafly-selected-team');
        if (urlTeam && urlTeam !== 'All' && availableNextSprintTeams.includes(urlTeam)) {
          currentNextSprintTeam = urlTeam;
          sessionStorage.setItem('jirafly-selected-team', urlTeam);
        } else if (savedTeam && availableNextSprintTeams.includes(savedTeam)) {
          currentNextSprintTeam = savedTeam;
        }
        // Populate team filter dropdown for planning page
        populatePlanningTeamFilter(nextSprintData.teams || [], currentNextSprintTeam);

        statusEl.className = '';
        updateNextSprintStatus();

        renderNextSprintCharts();
        const filteredData = getNextSprintDataForTeam(currentNextSprintTeam);
        renderNextSprintTable(filteredData);
        document.getElementById('nextSprintChartsContainer').style.display = 'grid';
        document.getElementById('unassignedTableWrapper').style.display = 'block';

        // Enable team toggle button (only in BE mode)
        document.getElementById('teamToggle').disabled = currentMode === 'fe';
      } catch (error) {
        statusEl.className = 'error';
        statusEl.textContent = \`Error: \${error.message}\`;
      }
    }

    function updateNextSprintStatus() {
      const statusEl = document.getElementById('status');
      const total = nextSprintData.totalBeIssues + nextSprintData.totalFeIssues;
      const nextVersion = currentMode === 'fe'
        ? nextSprintData.feNextVersion
        : nextSprintData.beNextVersion;
      const currentVersion = currentMode === 'fe'
        ? nextSprintData.feCurrentVersion
        : nextSprintData.beCurrentVersion;
      const sprintDates = currentMode === 'fe'
        ? nextSprintData.feSprintDates
        : nextSprintData.beSprintDates;

      const leftText = \`Loaded \${total} tasks for sprint \${nextVersion}\`;

      // Show current sprint info on the right (same format as other pages)
      let rightText = '';
      if (currentVersion) {
        rightText = \`Now is \${currentVersion}\`;
        if (sprintDates) {
          rightText += \` (\${sprintDates.startDate} - \${sprintDates.endDate})\`;
        }
      }

      if (rightText) {
        statusEl.innerHTML = \`<span>\${leftText}</span><span class="status-sprint-info">\${rightText}</span>\`;
      } else {
        statusEl.textContent = leftText;
      }
    }

    function getNextSprintDataForTeam(team) {
      if (!nextSprintData) return [];

      // FE mode: return all FE issues (no team filtering)
      if (currentMode === 'fe') {
        return nextSprintData.feIssues || [];
      }

      // BE mode: filter by team
      if (team === 'NoTeam') {
        return (nextSprintData.beIssues || []).filter(issue => !issue.team);
      }

      return (nextSprintData.beIssues || []).filter(issue => issue.team === team);
    }

    function updateNextSprintTeamButton(team) {
      const select = document.getElementById('teamToggle');
      select.value = team;
    }

    function populatePlanningTeamFilter(teams, selectedValue) {
      const select = document.getElementById('teamToggle');
      select.innerHTML = '<option value="NoTeam">No team</option>';
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        // Strip "Team" prefix and add " team" suffix for display
        const displayName = team.replace(/^Team/i, '');
        option.textContent = \`\${displayName} team\`;
        if (team === selectedValue) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    function handlePlanningTeamChange() {
      currentNextSprintTeam = document.getElementById('teamToggle').value;

      // Reset assignee filter when switching teams
      planningAssigneeFilter = '';

      // Save specific team to sessionStorage for cross-page sync
      if (currentNextSprintTeam !== 'NoTeam') {
        sessionStorage.setItem('jirafly-selected-team', currentNextSprintTeam);
      } else {
        sessionStorage.removeItem('jirafly-selected-team');
      }

      // Update URL with team parameter
      const params = new URLSearchParams(window.location.search);
      if (currentNextSprintTeam === 'NoTeam') {
        params.delete('team');
      } else {
        params.set('team', toShortTeamName(currentNextSprintTeam));
      }
      const newUrl = '/planning' + (params.toString() ? \`?\${params.toString()}\` : '');
      window.history.pushState({}, '', newUrl);

      // Re-render with filtered data
      const filteredData = getNextSprintDataForTeam(currentNextSprintTeam);
      renderNextSprintTable(filteredData);
    }

    function toggleHleColumn() {
      const isChecked = document.getElementById('hleToggle').checked;
      sessionStorage.setItem('jirafly-hle-visible', isChecked);
      applyHleVisibility(isChecked);
    }

    function applyHleVisibility(isVisible) {
      const table = document.getElementById('unassignedTable');
      const hleCells = table.querySelectorAll('.col-hle');
      hleCells.forEach(cell => {
        cell.classList.toggle('hidden', !isVisible);
      });
    }

    function initHleToggle() {
      const saved = sessionStorage.getItem('jirafly-hle-visible');
      if (saved !== null) {
        const isVisible = saved === 'true';
        document.getElementById('hleToggle').checked = isVisible;
        applyHleVisibility(isVisible);
      }
    }

    function renderNextSprintTable(tableData) {
      const tbody = document.getElementById('unassignedTableBody');
      tbody.innerHTML = '';

      // Populate assignee filter with all assignees (before filtering)
      const allAssignees = getUniqueAssignees(tableData);
      populateAssigneeFilter('planningAssigneeFilter', allAssignees, planningAssigneeFilter);

      // Apply assignee filter
      const filteredData = planningAssigneeFilter
        ? tableData.filter(row => row.assignee === planningAssigneeFilter)
        : tableData;

      let tableTitle;
      if (currentMode === 'fe') {
        tableTitle = \`FE Tasks (\${filteredData.length})\`;
      } else {
        const teamLabel = currentNextSprintTeam === 'NoTeam' ? 'Without Team' : currentNextSprintTeam.replace(/^Team/, '') + ' Team';
        tableTitle = \`Tasks \${teamLabel} (\${filteredData.length})\`;
      }
      document.getElementById('unassignedTableTitle').textContent = tableTitle;

      let prevAssignee = null;
      filteredData.forEach(row => {
        const tr = document.createElement('tr');

        // Highlight rows with 0 HLE
        if (!row.hle || row.hle === 0) {
          tr.classList.add('row-hle-zero');
        }

        // Assignee column - only show on first occurrence
        const assigneeTd = document.createElement('td');
        assigneeTd.className = 'col-assignee';
        if (row.assignee !== prevAssignee) {
          assigneeTd.textContent = row.assignee || 'Unassigned';
          prevAssignee = row.assignee;
        } else {
          assigneeTd.innerHTML = '<span class="empty-cell">—</span>';
        }
        tr.appendChild(assigneeTd);

        // WSJF column
        const wsjfTd = document.createElement('td');
        wsjfTd.className = 'col-wsjf';
        wsjfTd.textContent = row.wsjf ? row.wsjf.toFixed(1) : '-';
        tr.appendChild(wsjfTd);

        // Task column
        const taskTd = document.createElement('td');
        taskTd.className = 'col-task';
        const jiraUrl = \`\${JIRA_BROWSE_URL}\${row.key}\`;
        let typeClass = 'task-type';
        if (row.issueType === 'Bug') typeClass += ' task-type-bug';
        else if (row.issueType === 'Epic') typeClass += ' task-type-epic';
        else if (row.issueType === 'Analysis') typeClass += ' task-type-analysis';

        // Summary class based on category
        let summaryClass = 'task-summary';
        if (row.category === 'Maintenance') summaryClass += ' task-summary-maintenance';
        else if (row.category === 'Excluded') summaryClass += ' task-summary-excluded';

        taskTd.innerHTML = \`
          <span class="\${typeClass}">\${row.typeAbbr}</span>
          <a href="\${jiraUrl}" target="_blank" class="task-key">\${row.key}</a>:
          <span class="\${summaryClass}">\${row.summary}</span>
        \`;
        tr.appendChild(taskTd);

        // HLE column
        const hleTd = document.createElement('td');
        const savedHle = sessionStorage.getItem('jirafly-hle-visible');
        const hleVisible = savedHle !== null ? savedHle === 'true' : document.getElementById('hleToggle').checked;
        hleTd.className = 'col-hle' + (hleVisible ? '' : ' hidden');
        if (!row.hle || row.hle === 0) {
          hleTd.innerHTML = '<span class="hle-zero">0</span>';
        } else {
          hleTd.textContent = row.hle.toFixed(2);
        }
        tr.appendChild(hleTd);

        // Due Date column
        const dueTd = document.createElement('td');
        dueTd.className = 'col-due';
        if (row.dueDateRaw) {
          dueTd.innerHTML = \`<span class="due-badge">\${row.dueDate}</span>\`;
        } else {
          dueTd.innerHTML = '<span class="empty-cell">-</span>';
        }
        tr.appendChild(dueTd);

        // Status column
        const statusTd = document.createElement('td');
        statusTd.className = 'col-status';
        const doneStatuses = ['Done', 'In Testing', 'Merged'];
        const reviewStatuses = ['In Review'];
        let statusClass = 'status-label';
        if (doneStatuses.includes(row.status)) {
          statusClass += ' status-done';
        } else if (reviewStatuses.includes(row.status)) {
          statusClass += ' status-review';
        }
        statusTd.innerHTML = \`<span class="\${statusClass}">\${row.status}</span>\`;
        tr.appendChild(statusTd);

        tbody.appendChild(tr);
      });
    }

    // Future Sprints page functions
    async function loadFutureSprintsData() {
      const statusEl = document.getElementById('status');
      statusEl.className = 'loading';
      statusEl.innerHTML = '<span><span class="spinner"></span>Loading future sprints...</span>';

      try {
        const response = await fetch('/api/next-sprints');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load data');
        }

        const data = await response.json();

        // Cache data (single cache for both BE and FE since we fetch both)
        futureSprintsData = data;

        // Check if user switched to different page during loading
        if (currentPage !== 'next-sprints') {
          return;
        }

        statusEl.className = '';
        updateFutureSprintsStatus();

        renderFutureSprintsCharts();
        const tableData = getFutureSprintsTableData();
        renderFutureSprintsTable(tableData);
        document.getElementById('futureSprintsChartsContainer').style.display = 'grid';
        document.getElementById('futureSprintsTableWrapper').style.display = 'block';
      } catch (error) {
        statusEl.className = 'error';
        statusEl.textContent = \`Error: \${error.message}\`;
      }
    }

    function getFutureSprintsTableData() {
      if (!futureSprintsData) return [];
      return currentMode === 'fe' ? futureSprintsData.feIssues : futureSprintsData.beIssues;
    }

    function updateFutureSprintsStatus() {
      const statusEl = document.getElementById('status');
      const totalBe = futureSprintsData.totalBeIssues || 0;
      const totalFe = futureSprintsData.totalFeIssues || 0;
      const total = totalBe + totalFe;
      const versions = futureSprintsData.beFutureVersions || futureSprintsData.feFutureVersions || [];
      const currentVersion = futureSprintsData.beCurrentVersion || futureSprintsData.feCurrentVersion;
      const sprintDates = futureSprintsData.beSprintDates || futureSprintsData.feSprintDates;

      const leftText = \`Loaded \${total} tasks from \${versions.length} future sprints\`;

      let rightText = '';
      if (currentVersion) {
        rightText = \`Now is \${currentVersion}\`;
        if (sprintDates) {
          rightText += \` (\${sprintDates.startDate} - \${sprintDates.endDate})\`;
        }
      }

      if (rightText) {
        statusEl.innerHTML = \`<span>\${leftText}</span><span class="status-sprint-info">\${rightText}</span>\`;
      } else {
        statusEl.textContent = leftText;
      }
    }

    function renderFutureSprintsCharts() {
      if (!futureSprintsData) return;

      const categories = ['Excluded', 'Maintenance', 'Bug', 'Product'];

      // Get data based on current mode
      const issues = currentMode === 'fe' ? futureSprintsData.feIssues : futureSprintsData.beIssues;
      const futureVersions = currentMode === 'fe' ? futureSprintsData.feFutureVersions : futureSprintsData.beFutureVersions;

      if (!futureVersions || futureVersions.length === 0) {
        console.log('No future versions to render');
        return;
      }

      // Calculate HLE by sprint and category
      const hleByGroup = {};
      futureVersions.forEach(version => {
        hleByGroup[version] = {};
        categories.forEach(cat => hleByGroup[version][cat] = 0);
      });

      (issues || []).forEach(issue => {
        if (issue.issueType === 'Epic') return; // Skip Epics
        const sprint = issue.sprint;
        if (!sprint || !hleByGroup[sprint]) return;
        const category = issue.category || 'Product';
        const hle = issue.hle || 0;
        hleByGroup[sprint][category] = (hleByGroup[sprint][category] || 0) + hle;
      });

      // Prepare percentage data (exclude Excluded from 100%)
      const percentageCategories = categories.filter(cat => cat !== 'Excluded');
      const percentageData = {};
      percentageCategories.forEach(cat => percentageData[cat] = []);

      futureVersions.forEach(version => {
        const total = percentageCategories.reduce((sum, cat) => sum + (hleByGroup[version][cat] || 0), 0);
        percentageCategories.forEach(cat => {
          const perc = total > 0 ? Math.round((hleByGroup[version][cat] || 0) / total * 1000) / 10 : 0;
          percentageData[cat].push(perc);
        });
      });

      // Prepare HLE data
      const hleData = {};
      categories.forEach(cat => {
        hleData[cat] = futureVersions.map(version => hleByGroup[version][cat] || 0);
      });

      // Destroy old charts
      if (futureSprintsPercentageChart) futureSprintsPercentageChart.destroy();
      if (futureSprintsHleChart) futureSprintsHleChart.destroy();

      const chartLabels = [...futureVersions];

      const percentageCtx = document.getElementById('futureSprintsPercentageChart').getContext('2d');
      futureSprintsPercentageChart = new Chart(percentageCtx, buildChartConfig(
        chartLabels, percentageCategories, percentageData,
        {
          min: 0,
          max: 100,
          ticks: { callback: value => value + '%' },
          title: { display: true, text: 'Percentage (%) by HLE', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(1) + '%'
      ));

      const hleCtx = document.getElementById('futureSprintsHleChart').getContext('2d');
      futureSprintsHleChart = new Chart(hleCtx, buildChartConfig(
        chartLabels, categories, hleData,
        {
          beginAtZero: true,
          title: { display: true, text: 'HLE Value', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(2)
      ));
    }

    function renderFutureSprintsTable(tableData) {
      const container = document.getElementById('futureSprintsTableContainer');
      container.innerHTML = '';

      // Populate assignee filter with all assignees (before filtering)
      const allAssignees = getUniqueAssignees(tableData);
      populateAssigneeFilter('futureSprintsAssigneeFilter', allAssignees, futureSprintsAssigneeFilter);

      // Apply assignee filter
      const filteredData = futureSprintsAssigneeFilter
        ? tableData.filter(row => row.assignee === futureSprintsAssigneeFilter)
        : tableData;

      const modeLabel = currentMode === 'fe' ? 'FE' : 'BE';
      const tableTitle = \`\${modeLabel} Future Sprints Tasks (\${filteredData.length})\`;
      document.getElementById('futureSprintsTableTitle').textContent = tableTitle;

      // Group data by sprint
      const sprintGroups = {};
      const sprintOrder = [];
      filteredData.forEach(row => {
        if (!sprintGroups[row.sprint]) {
          sprintGroups[row.sprint] = [];
          sprintOrder.push(row.sprint);
        }
        sprintGroups[row.sprint].push(row);
      });

      // Create a section for each sprint
      sprintOrder.forEach(sprint => {
        const sprintData = sprintGroups[sprint];

        const section = document.createElement('div');
        section.className = 'sprint-section';

        // Sprint header
        const header = document.createElement('div');
        header.className = 'sprint-header';
        header.textContent = \`Sprint \${sprint} (\${sprintData.length})\`;
        section.appendChild(header);

        // Create table for this sprint
        const table = document.createElement('table');
        table.className = 'issues-table';

        const thead = document.createElement('thead');
        thead.innerHTML = \`
          <tr>
            <th class="col-assignee">Assignee</th>
            <th class="col-wsjf">WSJF</th>
            <th class="col-task">Task</th>
            <th class="col-hle">HLE</th>
            <th class="col-due">Due Date</th>
            <th class="col-status">Status</th>
          </tr>
        \`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let prevAssignee = null;

        sprintData.forEach(row => {
          const tr = document.createElement('tr');

          // Highlight rows with 0 HLE
          if (!row.hle || row.hle === 0) {
            tr.classList.add('row-hle-zero');
          }

          // Assignee column (show only if different from previous)
          const assigneeTd = document.createElement('td');
          assigneeTd.className = 'col-assignee';
          if (row.assignee !== prevAssignee) {
            assigneeTd.textContent = row.assignee || 'Unassigned';
            prevAssignee = row.assignee;
          } else {
            assigneeTd.innerHTML = '<span class="empty-cell">—</span>';
          }
          tr.appendChild(assigneeTd);

          // WSJF column
          const wsjfTd = document.createElement('td');
          wsjfTd.className = 'col-wsjf';
          wsjfTd.textContent = row.wsjf ? row.wsjf.toFixed(1) : '-';
          tr.appendChild(wsjfTd);

          // Task column
          const taskTd = document.createElement('td');
          taskTd.className = 'col-task';
          const jiraUrl = \`\${JIRA_BROWSE_URL}\${row.key}\`;
          let typeClass = 'task-type';
          if (row.issueType === 'Bug') typeClass += ' task-type-bug';
          else if (row.issueType === 'Epic') typeClass += ' task-type-epic';
          else if (row.issueType === 'Analysis') typeClass += ' task-type-analysis';

          // Summary class based on category
          let summaryClass = 'task-summary';
          if (row.category === 'Maintenance') summaryClass += ' task-summary-maintenance';
          else if (row.category === 'Excluded') summaryClass += ' task-summary-excluded';

          taskTd.innerHTML = \`
            <span class="\${typeClass}">\${row.typeAbbr}</span>
            <a href="\${jiraUrl}" target="_blank" class="task-key">\${row.key}</a>:
            <span class="\${summaryClass}">\${row.summary}</span>
          \`;
          tr.appendChild(taskTd);

          // HLE column
          const hleTd = document.createElement('td');
          hleTd.className = 'col-hle';
          if (!row.hle || row.hle === 0) {
            hleTd.innerHTML = '<span class="hle-zero">0</span>';
          } else {
            hleTd.textContent = row.hle.toFixed(2);
          }
          tr.appendChild(hleTd);

          // Due Date column
          const dueTd = document.createElement('td');
          dueTd.className = 'col-due';
          if (row.dueDateRaw) {
            dueTd.innerHTML = \`<span class="due-badge">\${row.dueDate}</span>\`;
          } else {
            dueTd.innerHTML = '<span class="empty-cell">-</span>';
          }
          tr.appendChild(dueTd);

          // Status column
          const statusTd = document.createElement('td');
          statusTd.className = 'col-status';
          const doneStatuses = ['Done', 'In Testing', 'Merged'];
          const reviewStatuses = ['In Review'];
          let statusClass = 'status-label';
          if (doneStatuses.includes(row.status)) {
            statusClass += ' status-done';
          } else if (reviewStatuses.includes(row.status)) {
            statusClass += ' status-review';
          }
          statusTd.innerHTML = \`<span class="\${statusClass}">\${row.status}</span>\`;
          tr.appendChild(statusTd);

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
      });
    }

    // Theme toggle functionality
    function initTheme() {
      const savedTheme = localStorage.getItem('jirafly-theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        updateThemeIcons(true);
      }
    }

    function updateThemeIcons(isDark) {
      document.getElementById('moonIcon').style.display = isDark ? 'none' : 'block';
      document.getElementById('sunIcon').style.display = isDark ? 'block' : 'none';
    }

    function toggleTheme() {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('jirafly-theme', isDark ? 'dark' : 'light');
      updateThemeIcons(isDark);
      updateChartsTheme();
    }

    function getChartColors() {
      const isDark = document.body.classList.contains('dark');
      return {
        legendColor: isDark ? '#e5e5e5' : '#000',
        tickColor: isDark ? '#999' : '#666',
        gridColor: isDark ? '#3a3a3a' : '#f0f0f0',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0'
      };
    }

    function getDarkModeChartColors() {
      const isDark = document.body.classList.contains('dark');
      if (!isDark) return COLORS;
      // Darker, more saturated colors for dark mode
      return {
        'Excluded': '#db2777',
        'Maintenance': '#3b82f6',
        'Bug': '#dc2626',
        'Product': '#22c55e'
      };
    }

    function updateChartsTheme() {
      const colors = getChartColors();
      const chartColors = getDarkModeChartColors();

      const allCharts = [percentageChart, hleChart, nextSprintPercentageChart, nextSprintHleChart, futureSprintsPercentageChart, futureSprintsHleChart].filter(c => c);

      allCharts.forEach(chart => {
        // Update legend
        chart.options.plugins.legend.labels.color = colors.legendColor;
        // Update axes
        chart.options.scales.x.ticks.color = colors.tickColor;
        chart.options.scales.x.border.color = colors.borderColor;
        chart.options.scales.y.ticks.color = colors.tickColor;
        chart.options.scales.y.grid.color = colors.gridColor;
        // Update dataset colors
        chart.data.datasets.forEach(dataset => {
          dataset.backgroundColor = chartColors[dataset.label];
        });
        chart.update();
      });
    }

    // Initialize theme immediately
    initTheme();

    // Setup theme toggle button
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    function calculatePercentage(value, total) {
      if (!total || total === 0) return 0;
      const val = value || 0;
      return Math.round((val / total) * 1000) / 10;
    }

    /**
     * Prepares percentage data for visualization, calculating both individual 
     * group percentages and the weighted average across all groups.
     */
    function preparePercentageData(groups, categories, hleByGroup) {
      // Exclude categories that should not be part of the total (e.g., 'Excluded')
      const filteredCategories = categories.filter(cat => cat !== 'Excluded');
    
      const percentageData = {};
      filteredCategories.forEach(category => percentageData[category] = []);
    
      // Tracking totals for weighted average calculation
      const aggregateTotalsByCategory = {};
      let overallTotalHle = 0;
      
      filteredCategories.forEach(cat => aggregateTotalsByCategory[cat] = 0);
    
      // Calculate percentages per group based on HLE
      groups.forEach(group => {
        const groupHleData = hleByGroup[group] || {};
        
        // Calculate total HLE for the current group excluding 'Excluded' category
        const groupTotal = filteredCategories.reduce(
          (sum, cat) => sum + (groupHleData[cat] || 0), 
          0
        );
        
        filteredCategories.forEach(category => {
          const categoryValue = groupHleData[category] || 0;
          
          // Accumulate values for the global weighted average
          aggregateTotalsByCategory[category] += categoryValue;
          overallTotalHle += categoryValue;
    
          // Calculate and store the percentage for this specific group
          const perc = calculatePercentage(categoryValue, groupTotal);
          percentageData[category].push(perc);
        });
      });
    
      // Calculate the weighted average across all groups
      // Logic: (Sum of Category HLE across all groups) / (Total HLE across all groups)
      filteredCategories.forEach(category => {
        const weightedAvg = calculatePercentage(
          aggregateTotalsByCategory[category], 
          overallTotalHle
        );
        
        // Append the weighted average as the final element in the array
        percentageData[category].push(weightedAvg);
      });
    
      return percentageData;
    }

    function prepareHLEData(groups, categories, hleByGroup) {
      const hleData = {};
      categories.forEach(category => {
        const values = groups.map(group => hleByGroup[group][category] || 0);
        // Calculate average and append it
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        hleData[category] = [...values, Math.round(avg * 100) / 100];
      });
      return hleData;
    }

    function buildChartConfig(groups, categories, data, yAxisConfig, tooltipFormatter) {
      const colors = getChartColors();
      const chartColors = getDarkModeChartColors();

      return {
        type: 'bar',
        data: {
          labels: groups,
          datasets: categories.map(category => ({
            label: category,
            data: data[category],
            backgroundColor: chartColors[category],
            borderWidth: 0
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            title: { display: false },
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: colors.legendColor,
                padding: 12,
                usePointStyle: true,
                pointStyle: 'rect'
              }
            },
            tooltip: {
              backgroundColor: '#000',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#000',
              borderWidth: 1,
              padding: 12,
              titleFont: {
                family: 'JetBrains Mono',
                size: 12
              },
              bodyFont: {
                family: 'JetBrains Mono',
                size: 11
              },
              callbacks: {
                label: function(context) {
                  return \`\${context.dataset.label}: \${tooltipFormatter(context.parsed.y)}\`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: colors.tickColor
              },
              border: {
                color: colors.borderColor
              }
            },
            y: {
              stacked: true,
              grid: {
                color: colors.gridColor,
                drawBorder: false
              },
              ticks: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: colors.tickColor,
                ...(yAxisConfig.ticks || {})
              },
              border: {
                color: colors.borderColor
              },
              title: yAxisConfig.title,
              min: yAxisConfig.min,
              max: yAxisConfig.max,
              beginAtZero: yAxisConfig.beginAtZero
            }
          }
        }
      };
    }

    // Convert short team name to full name (serenity -> TeamSerenity)
    function toFullTeamName(shortName) {
      if (!shortName || shortName === 'All') return 'All';
      // Already full name
      if (shortName.startsWith('Team')) return shortName;
      // Convert: serenity -> TeamSerenity
      return 'Team' + shortName.charAt(0).toUpperCase() + shortName.slice(1).toLowerCase();
    }

    // Convert full team name to short name (TeamSerenity -> serenity)
    function toShortTeamName(fullName) {
      if (!fullName || fullName === 'All') return null;
      return fullName.replace(/^Team/i, '').toLowerCase();
    }

    function getURLParams() {
      const params = new URLSearchParams(window.location.search);
      const teamParam = params.get('team');
      const projectParam = params.get('project');
      return {
        team: toFullTeamName(teamParam),
        sprintCount: params.get('sprints') ? parseInt(params.get('sprints')) : null,
        project: projectParam === 'fe' ? 'fe' : 'be'
      };
    }

    function toggleMode() {
      // Toggle between BE and FE
      currentMode = currentMode === 'be' ? 'fe' : 'be';

      // Clear team selection from sessionStorage when switching modes
      sessionStorage.removeItem('jirafly-selected-team');

      // Reset assignee filters when switching modes
      overviewAssigneeFilter = '';
      planningAssigneeFilter = '';
      futureSprintsAssigneeFilter = '';

      // Update URL with mode parameter
      const params = new URLSearchParams(window.location.search);
      if (currentMode === 'be') {
        params.delete('project');
      } else {
        params.set('project', 'fe');
      }
      // Remove team param when switching to FE (no teams in FE mode)
      if (currentMode === 'fe') {
        params.delete('team');
      }
      const newUrl = params.toString() ? \`?\${params.toString()}\` : window.location.pathname;
      window.history.pushState({}, '', newUrl);

      updateModeButton();

      // Handle planning page toggle
      if (currentPage === 'planning') {
        // In FE mode, show disabled team toggle with "No team"
        const teamSelect = document.getElementById('teamToggle');
        if (currentMode === 'fe') {
          teamSelect.innerHTML = '<option value="NoTeam">No team</option>';
          teamSelect.disabled = true;
        } else {
          // Repopulate with teams for BE mode
          populatePlanningTeamFilter(nextSprintData?.teams || [], 'NoTeam');
          teamSelect.disabled = false;
        }

        // Reset team selection
        currentNextSprintTeam = 'NoTeam';

        // Update status with current mode's version
        updateNextSprintStatus();

        // Re-render table with correct data
        const filteredData = getNextSprintDataForTeam(currentNextSprintTeam);
        renderNextSprintTable(filteredData);

        // Charts don't need to be re-rendered (they always show all data)
        return;
      }

      // Handle future sprints page toggle
      if (currentPage === 'next-sprints') {
        // Data already loaded for both modes - just re-render
        if (futureSprintsData) {
          renderFutureSprintsCharts();
          const tableData = getFutureSprintsTableData();
          renderFutureSprintsTable(tableData);
          updateFutureSprintsStatus();
        }
        return;
      }

      // History page mode toggle logic
      updateTeamButtonVisibility();

      // Check if we have cached data for this mode
      const cachedData = currentMode === 'be' ? beDataCache : feDataCache;

      if (cachedData) {
        // Use cached data
        allData = cachedData;

        // Set available teams from cached data
        if (allData.teams && allData.teams.length > 0) {
          availableTeams = ['All', ...allData.teams];
        } else {
          availableTeams = ['All'];
        }

        // Reset team selection
        currentTeam = 'All';
        // Populate team filter dropdown
        populateTeamFilter(allData.teams || [], currentTeam);

        // Render cached data
        const teamData = getDataForTeam(currentTeam);
        renderCharts(teamData);
        renderTable(teamData.tableData);
        document.getElementById('chartsContainer').style.display = 'grid';
        document.getElementById('tableWrapper').style.display = 'block';

        // Update status
        const statusEl = document.getElementById('status');
        const sprintInfo = allData.sprintCount ? \` from the last \${allData.sprintCount} sprints\` : '';
        const leftText = \`Loaded \${allData.all.totalIssues} tasks\${sprintInfo}\`;
        let rightText = '';
        if (allData.currentVersion) {
          rightText = \`Now is \${allData.currentVersion}\`;
          if (allData.sprintDates) {
            rightText += \` (\${allData.sprintDates.startDate} - \${allData.sprintDates.endDate})\`;
          }
        }
        if (rightText) {
          statusEl.innerHTML = \`<span>\${leftText}</span><span class="status-sprint-info">\${rightText}</span>\`;
        } else {
          statusEl.textContent = leftText;
        }

        // Update team button state
        const teamButton = document.getElementById('teamToggle');
        teamButton.disabled = currentMode === 'fe';

        // Enable assignee filter (renderTable already populated it)
        document.getElementById('overviewAssigneeFilter').disabled = false;
      } else {
        // Hide content while loading new data
        document.getElementById('chartsContainer').style.display = 'none';
        document.getElementById('tableWrapper').style.display = 'none';

        // Clear and disable assignee filter while loading
        const assigneeFilter = document.getElementById('overviewAssigneeFilter');
        assigneeFilter.innerHTML = '<option value="">All members</option>';
        assigneeFilter.disabled = true;

        // Clear current data and reload
        allData = null;
        currentTeam = 'All';
        availableTeams = ['All'];
        loadData();
      }
    }

    function updateModeButton() {
      const button = document.getElementById('modeToggle');
      button.textContent = currentMode.toUpperCase();
    }

    function updateTeamButtonVisibility() {
      const teamSelect = document.getElementById('teamToggle');
      // In FE mode, show disabled team select with "All teams"
      if (currentMode === 'fe' && currentPage === 'history') {
        teamSelect.innerHTML = '<option value="All">All teams</option>';
        teamSelect.disabled = true;
        teamSelect.style.display = '';
      } else {
        teamSelect.style.display = '';
      }
    }

    function updateOverviewAssigneeFilterVisibility() {
      const filter = document.getElementById('overviewAssigneeFilter');
      // Show only on overview (history) page
      if (currentPage === 'history') {
        filter.style.display = '';
        filter.disabled = !allData;
      } else {
        filter.style.display = 'none';
      }
    }

    function handleTeamChange() {
      if (currentPage === 'planning') {
        handlePlanningTeamChange();
        return;
      }

      currentTeam = document.getElementById('teamToggle').value;

      // Reset assignee filter when switching teams
      overviewAssigneeFilter = '';

      // Save specific team to sessionStorage for cross-page sync
      if (currentTeam !== 'All') {
        sessionStorage.setItem('jirafly-selected-team', currentTeam);
      } else {
        sessionStorage.removeItem('jirafly-selected-team');
      }

      // Update URL with team parameter (use short name)
      const params = new URLSearchParams(window.location.search);
      if (currentTeam === 'All') {
        params.delete('team');
      } else {
        params.set('team', toShortTeamName(currentTeam));
      }
      const newUrl = params.toString() ? \`?\${params.toString()}\` : window.location.pathname;
      window.history.pushState({}, '', newUrl);

      // Re-render with team data
      const teamData = getDataForTeam(currentTeam);
      if (teamData) {
        renderCharts(teamData);
        renderTable(teamData.tableData);
      }
    }

    function updateTeamButton(team) {
      const select = document.getElementById('teamToggle');
      select.value = team;
    }

    function populateTeamFilter(teams, selectedValue) {
      const select = document.getElementById('teamToggle');
      select.innerHTML = '<option value="All">All teams</option>';
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        // Strip "Team" prefix and add " team" suffix for display
        const displayName = team.replace(/^Team/i, '');
        option.textContent = \`\${displayName} team\`;
        if (team === selectedValue) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    function updateTableTitle(count) {
      const title = document.getElementById('tableTitle');
      title.textContent = \`Detailed Task List (\${count})\`;
    }

    async function loadData() {
      const { team, sprintCount } = getURLParams();
      const statusEl = document.getElementById('status');

      // Capture the mode at request start to detect if user switches during loading
      const requestedMode = currentMode;

      updateModeButton();
      updateTeamButtonVisibility();

      // Build API URL - use currentMode which is already set
      const params = new URLSearchParams();
      if (sprintCount) {
        params.set('sprints', sprintCount);
      }
      if (currentMode === 'fe') {
        params.set('project', 'fe');
      }
      const apiUrl = '/api/data' + (params.toString() ? \`?\${params.toString()}\` : '');

      console.log('[loadData] currentMode:', currentMode, 'apiUrl:', apiUrl);

      statusEl.className = 'loading';
      statusEl.innerHTML = '<span><span class="spinner"></span>Loading data from Jira...</span>';

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load data');
        }

        const data = await response.json();

        // Cache data for the mode that was requested (not current, which may have changed)
        if (requestedMode === 'be') {
          beDataCache = data;
        } else {
          feDataCache = data;
        }

        // Check if user switched to different page or mode during loading
        if (currentPage !== 'history' || currentMode !== requestedMode) {
          return;
        }

        // Store all data for client-side filtering (only if mode hasn't changed)
        allData = data;

        // Set available teams (empty for FE mode)
        if (data.teams && data.teams.length > 0) {
          availableTeams = ['All', ...data.teams];
        } else {
          availableTeams = ['All'];
        }

        // Set current team: URL param > sessionStorage > default 'All'
        // In FE mode, always use 'All' (no team filtering)
        if (currentMode === 'fe') {
          currentTeam = 'All';
        } else if (team && availableTeams.includes(team)) {
          currentTeam = team;
          // Also save to sessionStorage for cross-page sync
          sessionStorage.setItem('jirafly-selected-team', team);
        } else {
          const savedTeam = sessionStorage.getItem('jirafly-selected-team');
          if (savedTeam && availableTeams.includes(savedTeam)) {
            currentTeam = savedTeam;
          } else {
            currentTeam = 'All';
          }
        }
        // Populate team filter dropdown
        populateTeamFilter(data.teams || [], currentTeam);
        updateTeamButtonVisibility();

        statusEl.className = '';

        // Build status message - left side
        const sprintInfo = data.sprintCount ? \` from the last \${data.sprintCount} sprints\` : '';
        const leftText = \`Loaded \${data.all.totalIssues} tasks\${sprintInfo}\`;

        // Build sprint info - right side
        let rightText = '';
        if (data.currentVersion) {
          rightText = \`Now is \${data.currentVersion}\`;
          if (data.sprintDates) {
            rightText += \` (\${data.sprintDates.startDate} - \${data.sprintDates.endDate})\`;
          }
        }

        if (rightText) {
          statusEl.innerHTML = \`<span>\${leftText}</span><span class="status-sprint-info">\${rightText}</span>\`;
        } else {
          statusEl.textContent = leftText;
        }

        // Render data for selected team
        const teamData = getDataForTeam(currentTeam);
        renderCharts(teamData);
        renderTable(teamData.tableData);
        document.getElementById('chartsContainer').style.display = 'grid';
        document.getElementById('tableWrapper').style.display = 'block';

        // Enable team toggle button (only in BE mode)
        const teamButton = document.getElementById('teamToggle');
        teamButton.disabled = currentMode === 'fe';

        // Enable assignee filter
        document.getElementById('overviewAssigneeFilter').disabled = false;
      } catch (error) {
        statusEl.className = 'error';
        statusEl.textContent = \`Error: \${error.message}\`;
      }
    }

    function getDataForTeam(team) {
      if (!allData) return null;

      if (team === 'All') {
        return allData.all;
      }

      return allData.teamData[team] ? {
        ...allData.teamData[team].processedData,
        tableData: allData.teamData[team].tableData
      } : null;
    }

    function renderNextSprintCharts() {
      if (!nextSprintData || !nextSprintData.beIssues) return;

      // Group data by team (exclude No Team from charts)
      const categories = ['Excluded', 'Maintenance', 'Bug', 'Product'];
      const teams = nextSprintData.teams || [];
      const teamNames = teams.map(t => t.replace(/^Team/, ''));

      // Calculate HLE by team and category (BE teams)
      const hleByTeam = {};
      teamNames.forEach(team => {
        hleByTeam[team] = {};
        categories.forEach(cat => hleByTeam[team][cat] = 0);
      });

      (nextSprintData.beIssues || []).forEach(issue => {
        if (!issue.team) return; // Skip issues without team
        if (issue.issueType === 'Epic') return; // Skip Epics
        const teamKey = issue.team.replace(/^Team/, '');
        const category = issue.category || 'Product';
        const hle = issue.hle || 0;
        if (hleByTeam[teamKey]) {
          hleByTeam[teamKey][category] = (hleByTeam[teamKey][category] || 0) + hle;
        }
      });

      // Calculate FE HLE by category
      const feHle = { Excluded: 0, Maintenance: 0, Bug: 0, Product: 0 };
      (nextSprintData.feIssues || []).forEach(issue => {
        if (issue.issueType === 'Epic') return; // Skip Epics
        const category = issue.category || 'Product';
        feHle[category] = (feHle[category] || 0) + (issue.hle || 0);
      });

      // Prepare percentage data (exclude Excluded from 100%)
      const percentageCategories = categories.filter(cat => cat !== 'Excluded');
      const percentageData = {};
      percentageCategories.forEach(cat => percentageData[cat] = []);

      teamNames.forEach(team => {
        const total = percentageCategories.reduce((sum, cat) => sum + (hleByTeam[team][cat] || 0), 0);
        percentageCategories.forEach(cat => {
          const perc = total > 0 ? Math.round((hleByTeam[team][cat] || 0) / total * 1000) / 10 : 0;
          percentageData[cat].push(perc);
        });
      });

      // Add BE averages
      percentageCategories.forEach(cat => {
        const sum = percentageData[cat].reduce((acc, val) => acc + val, 0);
        percentageData[cat].push(sum / percentageData[cat].length);
      });

      // Add FE percentages
      const feTotal = percentageCategories.reduce((sum, cat) => sum + (feHle[cat] || 0), 0);
      percentageCategories.forEach(cat => {
        const fePerc = feTotal > 0 ? Math.round((feHle[cat] || 0) / feTotal * 1000) / 10 : 0;
        percentageData[cat].push(fePerc);
      });

      // Prepare HLE data
      const hleData = {};
      categories.forEach(cat => {
        hleData[cat] = teamNames.map(team => hleByTeam[team][cat] || 0);
        // Add BE sum
        const sum = hleData[cat].reduce((sum, val) => sum + val, 0);
        hleData[cat].push(Math.round(sum * 100) / 100);
        // Add FE value
        hleData[cat].push(feHle[cat] || 0);
      });

      // Destroy old charts
      if (nextSprintPercentageChart) nextSprintPercentageChart.destroy();
      if (nextSprintHleChart) nextSprintHleChart.destroy();

      const percentageLabels = [...teamNames, 'BE Avg', 'FE Team'];
      const hleLabels = [...teamNames, 'BE Sum', 'FE Team'];

      const percentageCtx = document.getElementById('nextSprintPercentageChart').getContext('2d');
      nextSprintPercentageChart = new Chart(percentageCtx, buildChartConfig(
        percentageLabels, percentageCategories, percentageData,
        {
          min: 0,
          max: 100,
          ticks: { callback: value => value + '%' },
          title: { display: true, text: 'Percentage (%) by HLE', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(1) + '%'
      ));

      const hleCtx = document.getElementById('nextSprintHleChart').getContext('2d');
      nextSprintHleChart = new Chart(hleCtx, buildChartConfig(
        hleLabels, categories, hleData,
        {
          beginAtZero: true,
          title: { display: true, text: 'HLE Value', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(2)
      ));
    }

    function renderCharts(data) {
      const { groups, categories, countsByGroup, hleByGroup } = data;

      // Filter out Excluded from percentage chart - it shouldn't count towards 100%
      const percentageCategories = categories.filter(cat => cat !== 'Excluded');

      const percentageData = preparePercentageData(groups, categories, hleByGroup);
      const hleData = prepareHLEData(groups, categories, hleByGroup);

      if (percentageChart) percentageChart.destroy();
      if (hleChart) hleChart.destroy();

      // Add "Average" label for both charts
      const groupsWithAverage = [...groups, 'Average'];

      const percentageCtx = document.getElementById('percentageChart').getContext('2d');
      percentageChart = new Chart(percentageCtx, buildChartConfig(
        groupsWithAverage, percentageCategories, percentageData,
        {
          min: 0,
          max: 100,
          ticks: { callback: value => value + '%' },
          title: { display: true, text: 'Percentage (%) by HLE', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(1) + '%'
      ));

      const hleCtx = document.getElementById('hleChart').getContext('2d');
      hleChart = new Chart(hleCtx, buildChartConfig(
        groupsWithAverage, categories, hleData,
        {
          beginAtZero: true,
          title: { display: true, text: 'HLE Value', font: { family: 'JetBrains Mono', size: 11 } }
        },
        value => value.toFixed(2)
      ));
    }

    function compareVersions(version1, version2) {
      // Compare two version strings like "6.18" and "6.19"
      // Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
      if (!version1 || !version2 || version1 === 'Ungrouped' || version2 === 'Ungrouped') {
        return 0;
      }

      const [major1, minor1] = version1.split('.').map(Number);
      const [major2, minor2] = version2.split('.').map(Number);

      if (major1 !== major2) {
        return major1 > major2 ? 1 : -1;
      }

      if (minor1 !== minor2) {
        return minor1 > minor2 ? 1 : -1;
      }

      return 0;
    }

    function renderTable(tableData) {
      const container = document.getElementById('issuesTableContainer');
      container.innerHTML = '';

      // Populate assignee filter with all assignees (before filtering)
      const allAssignees = getUniqueAssignees(tableData);
      populateAssigneeFilter('overviewAssigneeFilter', allAssignees, overviewAssigneeFilter);

      // Apply assignee filter
      const filteredData = overviewAssigneeFilter
        ? tableData.filter(row => row.assignee === overviewAssigneeFilter)
        : tableData;

      // Update table title with count
      updateTableTitle(filteredData.length);

      // Group data by sprint
      const sprintGroups = {};
      const sprintOrder = [];
      filteredData.forEach(row => {
        if (!sprintGroups[row.sprint]) {
          sprintGroups[row.sprint] = [];
          sprintOrder.push(row.sprint);
        }
        sprintGroups[row.sprint].push(row);
      });

      // Create a section for each sprint
      sprintOrder.forEach(sprint => {
        const sprintData = sprintGroups[sprint];

        const section = document.createElement('div');
        section.className = 'sprint-section';

        // Sprint header
        const header = document.createElement('div');
        header.className = 'sprint-header';
        header.textContent = \`Sprint \${sprint} (\${sprintData.length})\`;
        section.appendChild(header);

        // Create table for this sprint
        const table = document.createElement('table');
        table.className = 'issues-table';

        const thead = document.createElement('thead');
        thead.innerHTML = \`
          <tr>
            <th class="col-assignee">Assignee</th>
            <th class="col-task">Task</th>
            <th class="col-hle">HLE</th>
            <th class="col-time">Tracked</th>
            <th class="col-version">Fix Version</th>
            <th class="col-status">Status</th>
          </tr>
        \`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let prevAssignee = null;

        sprintData.forEach(row => {
          const tr = document.createElement('tr');

          // Highlight rows with 0 HLE
          if (!row.hle || row.hle === 0) {
            tr.classList.add('row-hle-zero');
          }

          // Check if fix version differs from sprint (not equal)
          const isVersionMismatch = compareVersions(row.fixVersion, sprint) !== 0;

          // Assignee column (show only if different from previous)
          const assigneeTd = document.createElement('td');
          assigneeTd.className = 'col-assignee';
          if (row.assignee !== prevAssignee) {
            assigneeTd.textContent = row.assignee;
            prevAssignee = row.assignee;
          } else {
            assigneeTd.innerHTML = '<span class="empty-cell">—</span>';
          }
          tr.appendChild(assigneeTd);

          // Task column
          const taskTd = document.createElement('td');
          taskTd.className = 'col-task';
          const jiraUrl = \`\${JIRA_BROWSE_URL}\${row.key}\`;

          // Type badge - red background for bugs, gray for others
          let typeClass = 'task-type';
          if (row.issueType === 'Bug') {
            typeClass = 'task-type task-type-bug';
          } else if (row.issueType === 'Analysis') {
            typeClass = 'task-type task-type-analysis';
          }

          // Summary color - blue for Maintenance, pink for Excluded, black for others
          let summaryClass = 'task-summary';
          if (row.category === 'Maintenance') {
            summaryClass = 'task-summary-maintenance';
          } else if (row.category === 'Excluded') {
            summaryClass = 'task-summary-excluded';
          }

          taskTd.innerHTML = \`
            <span class="\${typeClass}">\${row.typeAbbr}</span>
            <a href="\${jiraUrl}" target="_blank" class="task-key">\${row.key}</a>:
            <span class="\${summaryClass}">\${row.summary}</span>
          \`;
          tr.appendChild(taskTd);

          // HLE column
          const hleTd = document.createElement('td');
          hleTd.className = 'col-hle';
          if (!row.hle || row.hle === 0) {
            hleTd.innerHTML = '<span class="hle-zero">0</span>';
          } else {
            hleTd.textContent = row.hle.toFixed(2);
          }
          tr.appendChild(hleTd);

          // Tracked time column with color coding
          // 1 HLE = 8 hours = 28800 seconds
          const timeTd = document.createElement('td');
          timeTd.className = 'col-time';

          const hleInSeconds = row.hle * 28800; // 1 HLE = 8 hours = 28800 seconds
          const ratio = hleInSeconds > 0 ? row.timeSpentSeconds / hleInSeconds : 0;

          if (ratio > 3) {
            // More than 3x HLE - red text
            timeTd.innerHTML = \`<span class="time-critical">\${row.timeSpent}</span>\`;
          } else if (ratio > 2) {
            // More than 2x HLE - orange text
            timeTd.innerHTML = \`<span class="time-warning">\${row.timeSpent}</span>\`;
          } else {
            // Normal - plain text
            timeTd.textContent = row.timeSpent;
          }
          tr.appendChild(timeTd);

          // Fix version column
          const versionTd = document.createElement('td');
          versionTd.className = 'col-version';
          if (row.fixVersion === 'Ungrouped') {
            versionTd.innerHTML = '<span class="empty-cell">—</span>';
          } else if (isVersionMismatch) {
            versionTd.innerHTML = \`<span class="version-mismatch">\${row.fixVersion}</span>\`;
          } else {
            versionTd.textContent = row.fixVersion;
          }
          tr.appendChild(versionTd);

          // Status column with color coding
          const statusTd = document.createElement('td');
          statusTd.className = 'col-status';

          // Green for Done, In Testing, Merged
          // Yellow for In Review
          // Gray for others
          const doneStatuses = ['Done', 'In Testing', 'Merged'];
          const reviewStatuses = ['In Review'];

          let statusClass = 'status-label';
          if (doneStatuses.includes(row.status)) {
            statusClass += ' status-done';
          } else if (reviewStatuses.includes(row.status)) {
            statusClass += ' status-review';
          }

          statusTd.innerHTML = \`<span class="\${statusClass}">\${row.status}</span>\`;
          tr.appendChild(statusTd);

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
      });

      document.getElementById('tableWrapper').style.display = 'block';
    }

    // Auto-load data when page loads
    window.addEventListener('DOMContentLoaded', () => {
      // Initialize page from URL
      currentPage = getPageFromURL();

      // Set up tab listeners
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page));
      });

      // Update active tab
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === currentPage);
      });

      // Set up mode toggle listener
      document.getElementById('modeToggle').addEventListener('click', toggleMode);

      // Set up team toggle listener
      document.getElementById('teamToggle').addEventListener('change', handleTeamChange);

      // Set up HLE toggle listener and restore saved state
      document.getElementById('hleToggle').addEventListener('change', toggleHleColumn);
      initHleToggle();

      // Set up assignee filter listeners
      document.getElementById('overviewAssigneeFilter').addEventListener('change', handleOverviewAssigneeFilter);
      document.getElementById('planningAssigneeFilter').addEventListener('change', handlePlanningAssigneeFilter);
      document.getElementById('futureSprintsAssigneeFilter').addEventListener('change', handleFutureSprintsAssigneeFilter);

      // Initialize mode from URL params
      const { project } = getURLParams();
      currentMode = project;
      updateModeButton();

      // Load appropriate data based on current page
      if (currentPage === 'history') {
        loadData();
      } else if (currentPage === 'planning') {
        // Enable mode toggle on planning page
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.disabled = false;
        modeToggle.textContent = currentMode.toUpperCase();
        loadNextSprintData();
        // Initialize team toggle for planning page
        const teamSelect = document.getElementById('teamToggle');
        teamSelect.innerHTML = '<option value="NoTeam">No team</option>';
        teamSelect.disabled = true; // Will be enabled after data loads (only in BE mode)
        teamSelect.style.display = '';
        // Hide overview assignee filter
        document.getElementById('overviewAssigneeFilter').style.display = 'none';
      } else if (currentPage === 'next-sprints') {
        // Enable mode toggle on future sprints page
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.disabled = false;
        modeToggle.textContent = currentMode.toUpperCase();
        loadFutureSprintsData();
        // Show disabled team toggle on future sprints page
        const teamSelect = document.getElementById('teamToggle');
        teamSelect.innerHTML = '<option value="All">All teams</option>';
        teamSelect.disabled = true;
        teamSelect.style.display = '';
        // Hide overview assignee filter
        document.getElementById('overviewAssigneeFilter').style.display = 'none';
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { generateHTML };
