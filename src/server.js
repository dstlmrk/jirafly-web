require('dotenv').config();
const express = require('express');
const JiraClient = require('./jira-client');
const dataProcessor = require('./data-processor');
const { generateHTML } = require('./html-template');
const { GROUP_BY_OPTIONS } = require('./config');

const app = express();
const PORT = parseInt(process.env.PORT);

const jiraClient = new JiraClient();

// Serve HTML page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generateHTML());
});

// API endpoint for Jira data
app.get('/api/data', async (req, res) => {
  if (!req.query.filter_id) {
    return res.status(400).json({
      error: 'filter_id parameter is required'
    });
  }

  if (!req.query.group_by) {
    return res.status(400).json({
      error: 'group_by parameter is required'
    });
  }

  const filterId = parseInt(req.query.filter_id);
  const groupBy = req.query.group_by;

  const validGroupByOptions = Object.values(GROUP_BY_OPTIONS);
  if (!validGroupByOptions.includes(groupBy)) {
    return res.status(400).json({
      error: `Invalid group_by parameter. Must be one of: ${validGroupByOptions.join(', ')}`
    });
  }

  console.log(`[API] Request: filter_id=${filterId}, group_by=${groupBy}`);

  const issues = await jiraClient.fetchIssuesByFilter(filterId);
  const processedData = dataProcessor.processIssues(issues, groupBy);

  console.log(`[API] Processed ${processedData.totalIssues} issues into ${processedData.groups.length} groups`);

  res.json(processedData);
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
