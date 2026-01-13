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

  #status {
    padding: 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    margin-bottom: 32px;
    color: var(--text-primary);
    font-weight: 400;
    font-size: 13px;
    transition: background 0.2s, border-color 0.2s;
  }

  #status.loading {
    border-color: var(--text-secondary);
  }

  #status.error {
    border-color: var(--text-primary);
    color: #ef4444;
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
        <p class="subtitle">Sprint Composition Overview</p>
      </div>
      <div class="header-buttons">
        <button id="teamToggle" class="group-toggle" disabled>All teams</button>
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
      </div>
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
      <table class="issues-table" id="issuesTable">
        <thead>
          <tr>
            <th class="col-sprint">Sprint</th>
            <th class="col-assignee">Assignee</th>
            <th class="col-task">Task</th>
            <th class="col-hle">HLE</th>
            <th class="col-time">Tracked</th>
            <th class="col-version">Fix Version</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody id="issuesTableBody">
        </tbody>
      </table>
    </div>
  </div>

  <script>
    let percentageChart = null;
    let hleChart = null;
    let allData = null; // Store all data for client-side filtering
    let rawIssues = []; // Store raw issues
    let currentTeam = 'All'; // Current selected team
    let availableTeams = ['All']; // Available teams

    const COLORS = ${JSON.stringify(CHART_COLORS)};
    const JIRA_BROWSE_URL = '${jiraBrowseUrl}';

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
      if (!percentageChart || !hleChart) return;

      const colors = getChartColors();
      const chartColors = getDarkModeChartColors();

      [percentageChart, hleChart].forEach(chart => {
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

    function preparePercentageData(groups, categories, hleByGroup) {
      // Filter out Excluded from percentage calculations - it shouldn't count towards 100%
      const filteredCategories = categories.filter(cat => cat !== 'Excluded');

      const percentageData = {};
      filteredCategories.forEach(category => percentageData[category] = []);

      // Add percentages for each group - based on HLE, not count!
      groups.forEach(group => {
        // Calculate total only from non-Excluded categories
        const total = filteredCategories.reduce((sum, cat) => sum + (hleByGroup[group][cat] || 0), 0);
        filteredCategories.forEach(category => {
          const perc = calculatePercentage(hleByGroup[group][category], total);
          percentageData[category].push(perc);
        });
      });

      // Calculate average percentages across all groups
      filteredCategories.forEach(category => {
        const sum = percentageData[category].reduce((acc, val) => acc + val, 0);
        const avg = sum / percentageData[category].length;
        percentageData[category].push(avg);
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
      return {
        filterId: params.get('filter_id'),
        groupBy: params.get('group_by') || 'sprint',
        team: toFullTeamName(teamParam),
        sprintCount: params.get('sprints') ? parseInt(params.get('sprints')) : null
      };
    }

    function toggleTeam() {
      const currentIndex = availableTeams.indexOf(currentTeam);
      const nextIndex = (currentIndex + 1) % availableTeams.length;
      currentTeam = availableTeams[nextIndex];

      // Update URL with team parameter (use short name)
      const params = new URLSearchParams(window.location.search);
      if (currentTeam === 'All') {
        params.delete('team');
      } else {
        params.set('team', toShortTeamName(currentTeam));
      }
      const newUrl = params.toString() ? \`?\${params.toString()}\` : window.location.pathname;
      window.history.pushState({}, '', newUrl);

      updateTeamButton(currentTeam);

      // Re-render with team data
      const teamData = getDataForTeam(currentTeam);
      if (teamData) {
        renderCharts(teamData);
        renderTable(teamData.tableData);
      }
    }

    function updateTeamButton(team) {
      const button = document.getElementById('teamToggle');
      if (team === 'All') {
        button.textContent = 'All teams';
      } else {
        // Strip "Team" prefix and add " team" suffix
        const displayName = team.replace(/^Team/i, '');
        button.textContent = \`\${displayName} team\`;
      }
    }

    function updateTableTitle(count) {
      const title = document.getElementById('tableTitle');
      title.textContent = \`Detailed Task List (\${count})\`;
    }

    async function loadData() {
      const { filterId, groupBy, team, sprintCount } = getURLParams();
      const statusEl = document.getElementById('status');

      // Build API URL
      let apiUrl;

      if (filterId) {
        apiUrl = \`/api/data?filter_id=\${filterId}&group_by=\${groupBy}\`;
      } else {
        apiUrl = \`/api/data?group_by=\${groupBy}\`;
        if (sprintCount) {
          apiUrl += \`&sprints=\${sprintCount}\`;
        }
      }

      statusEl.className = 'loading';
      statusEl.innerHTML = '<span class="spinner"></span>Loading data from Jira...';

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load data');
        }

        const data = await response.json();

        // Store all data for client-side filtering
        allData = data;

        // Set available teams
        if (data.teams && data.teams.length > 0) {
          availableTeams = ['All', ...data.teams];
        }

        // Set current team from URL (validate it exists)
        if (team && availableTeams.includes(team)) {
          currentTeam = team;
        } else {
          currentTeam = 'All';
        }
        updateTeamButton(currentTeam);

        statusEl.className = '';
        const sprintInfo = data.sprintCount ? \` from \${data.sprintCount} sprints\` : '';
        const currentInfo = data.currentVersion ? \` (current sprint \${data.currentVersion})\` : '';
        statusEl.textContent = \`Loaded \${data.all.totalIssues} tasks\${sprintInfo}\${currentInfo}\`;

        // Render data for selected team
        const teamData = getDataForTeam(currentTeam);
        renderCharts(teamData);
        renderTable(teamData.tableData);
        document.getElementById('chartsContainer').style.display = 'grid';
        document.getElementById('tableWrapper').style.display = 'block';

        // Enable team toggle button
        document.getElementById('teamToggle').disabled = false;
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
      const tbody = document.getElementById('issuesTableBody');
      tbody.innerHTML = '';

      // Update table title with count
      updateTableTitle(tableData.length);

      let prevSprint = null;
      let prevAssignee = null;

      tableData.forEach(row => {
        const tr = document.createElement('tr');

        // Add sprint-start class for visual separation between sprints
        if (row.sprint !== prevSprint && prevSprint !== null) {
          tr.classList.add('sprint-start');
        }

        // Highlight rows with 0 HLE
        if (!row.hle || row.hle === 0) {
          tr.classList.add('row-hle-zero');
        }

        // Check if fix version differs from sprint (not equal)
        const isVersionMismatch = compareVersions(row.fixVersion, row.sprint) !== 0;

        // Sprint column (show only if different from previous)
        const sprintTd = document.createElement('td');
        sprintTd.className = 'col-sprint';
        if (row.sprint !== prevSprint) {
          sprintTd.innerHTML = \`<span class="sprint-badge">\${row.sprint}</span>\`;
          prevSprint = row.sprint;
          prevAssignee = null; // Reset assignee when sprint changes
        } else {
          sprintTd.innerHTML = '<span class="empty-cell">—</span>';
        }
        tr.appendChild(sprintTd);

        // Assignee column (show only if different from previous within same sprint)
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

      document.getElementById('tableWrapper').style.display = 'block';
    }

    // Auto-load data when page loads
    window.addEventListener('DOMContentLoaded', () => {
      loadData();
      document.getElementById('teamToggle').addEventListener('click', toggleTeam);
    });
  </script>
</body>
</html>`;
}

module.exports = { generateHTML };
