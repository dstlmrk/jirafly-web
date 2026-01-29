require('dotenv').config();
const express = require('express');
const JiraClient = require('./jira-client');
const dataProcessor = require('./data-processor');
const { generateHTML } = require('./html-template');

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

// Serve HTML page (both routes serve the same SPA)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generateHTML({ jiraUrl: process.env.JIRA_URL }));
});

app.get('/planning', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generateHTML({ jiraUrl: process.env.JIRA_URL }));
});

app.get('/next-sprints', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generateHTML({ jiraUrl: process.env.JIRA_URL }));
});

// API endpoint for Jira data
app.get('/api/data', async (req, res) => {
  try {
    // Parse sprints parameter (optional, defaults to config value)
    const requestedSprintCount = req.query.sprints ? parseInt(req.query.sprints) : null;
    // Parse project parameter (be or fe, defaults to be)
    const project = req.query.project === 'fe' ? 'fe' : 'be';

    if (project === 'fe') {
      // Frontend mode - fetch from SS project
      console.log(`[API] Request: Frontend, sprints=${requestedSprintCount || 'default'}`);
      const result = await jiraClient.fetchFrontendIssues(requestedSprintCount);
      const issues = result.issues;
      const sprintCount = result.sprintCount;
      const currentVersion = result.currentVersion;
      const sprintDates = result.sprintDates;

      // Process data (no team filtering for FE)
      const allProcessedData = dataProcessor.processIssues(issues, 'sprint');
      const allTableData = dataProcessor.prepareTableData(issues, 'sprint');

      console.log(`[API] Processed ${allProcessedData.totalIssues} FE issues into ${allProcessedData.groups.length} groups`);

      res.json({
        all: {
          ...allProcessedData,
          tableData: allTableData
        },
        teams: [], // No teams for FE
        teamData: {},
        sprintCount,
        currentVersion,
        sprintDates,
        mode: 'fe'
      });
    } else {
      // Backend mode - existing behavior
      console.log(`[API] Request: All teams, sprints=${requestedSprintCount || 'default'}`);
      const result = await jiraClient.fetchAllTeamsIssues(requestedSprintCount);
      const issues = result.issues;
      const sprintCount = result.sprintCount;
      const currentVersion = result.currentVersion;
      const sprintDates = result.sprintDates;

      // Add team information to each issue based on labels
      const { TEAMS } = require('./config');
      const teamLabels = Object.values(TEAMS).map(t => t.label);

      issues.forEach(issue => {
        const labels = issue.fields.labels || [];
        const teamLabel = labels.find(l => teamLabels.includes(l));
        issue.team = teamLabel || 'Unknown';
      });

      // Process data for all teams combined (always group by sprint)
      const allProcessedData = dataProcessor.processIssues(issues, 'sprint');
      const allTableData = dataProcessor.prepareTableData(issues, 'sprint');

      // Process data for each team separately
      const teamData = {};
      teamLabels.forEach(teamLabel => {
        const teamIssues = issues.filter(issue => issue.team === teamLabel);
        if (teamIssues.length > 0) {
          teamData[teamLabel] = {
            processedData: dataProcessor.processIssues(teamIssues, 'sprint'),
            tableData: dataProcessor.prepareTableData(teamIssues, 'sprint')
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
        currentVersion,
        sprintDates,
        mode: 'be'
      });
    }
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// API endpoint for all issues in next sprint (from both BE and FE projects)
app.get('/api/next-sprint', async (req, res) => {
  try {
    console.log(`[API] Request: Next sprint issues (BE + FE)`);
    const result = await jiraClient.fetchBothProjectsNextSprintIssues();

    // Add team information to BE issues based on labels
    const { TEAMS } = require('./config');
    const teamLabels = Object.values(TEAMS).map(t => t.label);

    result.beIssues.forEach(issue => {
      const labels = issue.fields.labels || [];
      const teamLabel = labels.find(l => teamLabels.includes(l));
      issue.team = teamLabel || null; // null means no team
    });

    // FE issues don't have team labels
    result.feIssues.forEach(issue => {
      issue.team = null;
    });

    // Process data for table display
    const beTableData = dataProcessor.prepareUnassignedTableData(result.beIssues);
    const feTableData = dataProcessor.prepareUnassignedTableData(result.feIssues);

    console.log(`[API] Fetched ${result.beIssues.length} BE issues and ${result.feIssues.length} FE issues for next sprint`);

    res.json({
      beIssues: beTableData,
      feIssues: feTableData,
      beNextVersion: result.beNextVersion,
      feNextVersion: result.feNextVersion,
      beCurrentVersion: result.beCurrentVersion,
      feCurrentVersion: result.feCurrentVersion,
      beSprintDates: result.beSprintDates,
      feSprintDates: result.feSprintDates,
      totalBeIssues: result.beIssues.length,
      totalFeIssues: result.feIssues.length,
      teams: teamLabels
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// API endpoint for 6 future sprints (fetches BE and FE in parallel)
app.get('/api/next-sprints', async (req, res) => {
  try {
    console.log(`[API] Request: Future sprints (BE + FE)`);

    const result = await jiraClient.fetchBothProjectsFutureSprintsIssues();

    // Add team information to BE issues based on labels
    const { TEAMS } = require('./config');
    const teamLabels = Object.values(TEAMS).map(t => t.label);

    result.beIssues.forEach(issue => {
      const labels = issue.fields.labels || [];
      const teamLabel = labels.find(l => teamLabels.includes(l));
      issue.team = teamLabel || null;
    });

    // FE issues don't have team labels
    result.feIssues.forEach(issue => {
      issue.team = null;
    });

    // Prepare table data for both
    const beTableData = dataProcessor.prepareFutureSprintsTableData(result.beIssues);
    const feTableData = dataProcessor.prepareFutureSprintsTableData(result.feIssues);

    console.log(`[API] Fetched ${result.beIssues.length} BE issues and ${result.feIssues.length} FE issues for future sprints`);

    res.json({
      beIssues: beTableData,
      feIssues: feTableData,
      beCurrentVersion: result.beCurrentVersion,
      feCurrentVersion: result.feCurrentVersion,
      beFutureVersions: result.beFutureVersions,
      feFutureVersions: result.feFutureVersions,
      beSprintDates: result.beSprintDates,
      feSprintDates: result.feSprintDates,
      totalBeIssues: result.beIssues.length,
      totalFeIssues: result.feIssues.length,
      teams: teamLabels
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
