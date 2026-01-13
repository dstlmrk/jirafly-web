require('dotenv').config();
const express = require('express');
const JiraClient = require('./jira-client');
const dataProcessor = require('./data-processor');
const { generateHTML } = require('./html-template');
const { GROUP_BY_OPTIONS } = require('./config');

const app = express();
const PORT = parseInt(process.env.PORT);

const jiraClient = new JiraClient();

// Basic Authentication middleware
function basicAuth(req, res, next) {
  // Skip auth if not configured
  const authUser = process.env.AUTH_USERNAME;
  const authPass = process.env.AUTH_PASSWORD;

  if (!authUser || !authPass) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Jirafly"');
    return res.status(401).send('Authentication required');
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username === authUser && password === authPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Jirafly"');
  return res.status(401).send('Invalid credentials');
}

// Apply auth to all routes except /health
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  return basicAuth(req, res, next);
});

// Serve HTML page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generateHTML({ jiraUrl: process.env.JIRA_URL }));
});

// API endpoint for Jira data
app.get('/api/data', async (req, res) => {
  try {
    // Validate group_by parameter - required
    const groupBy = req.query.group_by;
    const validGroupByOptions = Object.values(GROUP_BY_OPTIONS);
    if (!groupBy) {
      return res.status(400).json({
        error: `Missing required group_by parameter. Must be one of: ${validGroupByOptions.join(', ')}`
      });
    }
    if (!validGroupByOptions.includes(groupBy)) {
      return res.status(400).json({
        error: `Invalid group_by parameter. Must be one of: ${validGroupByOptions.join(', ')}`
      });
    }

    // Parse sprints parameter (optional, defaults to config value)
    const requestedSprintCount = req.query.sprints ? parseInt(req.query.sprints) : null;

    let issues;
    let sprintCount = 0;
    let currentVersion = null;

    if (req.query.filter_id) {
      // Optional: Use specific filter_id
      const filterId = parseInt(req.query.filter_id);
      console.log(`[API] Request: filter_id=${filterId}, group_by=${groupBy}`);
      issues = await jiraClient.fetchIssuesByFilter(filterId);
    } else {
      // Default: All teams issues
      console.log(`[API] Request: All teams (auto sprint filtering), group_by=${groupBy}, sprints=${requestedSprintCount || 'default'}`);
      const result = await jiraClient.fetchAllTeamsIssues(requestedSprintCount);
      issues = result.issues;
      sprintCount = result.sprintCount;
      currentVersion = result.currentVersion;
    }

    // Add team information to each issue based on labels
    const { TEAMS } = require('./config');
    const teamLabels = Object.values(TEAMS).map(t => t.label);

    issues.forEach(issue => {
      const labels = issue.fields.labels || [];
      const teamLabel = labels.find(l => teamLabels.includes(l));
      issue.team = teamLabel || 'Unknown';
    });

    // Process data for all teams combined
    const allProcessedData = dataProcessor.processIssues(issues, groupBy);
    const allTableData = dataProcessor.prepareTableData(issues, groupBy);

    // Process data for each team separately
    const teamData = {};
    teamLabels.forEach(teamLabel => {
      const teamIssues = issues.filter(issue => issue.team === teamLabel);
      if (teamIssues.length > 0) {
        teamData[teamLabel] = {
          processedData: dataProcessor.processIssues(teamIssues, groupBy),
          tableData: dataProcessor.prepareTableData(teamIssues, groupBy)
        };
      }
    });

    console.log(`[API] Processed ${allProcessedData.totalIssues} issues into ${allProcessedData.groups.length} groups`);

    res.json({
      all: {
        ...allProcessedData,
        tableData: allTableData
      },
      teams: teamLabels,
      teamData,
      sprintCount,
      currentVersion
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🦋 Jirafly server running on http://localhost:${PORT}`);
  console.log(`Connected to: ${process.env.JIRA_URL}\n`);
});
