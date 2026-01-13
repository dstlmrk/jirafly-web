/**
 * API endpoint integration tests for Jirafly Web
 * Tests the /api/data endpoint responses
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const JiraClient = require('../../src/jira-client');
const dataProcessor = require('../../src/data-processor');
const { TEAMS } = require('../../src/config');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// Create a minimal test server
function createTestServer() {
  const app = express();
  const jiraClient = new JiraClient();

  app.get('/api/data', async (req, res) => {
    try {
      const groupBy = req.query.group_by || 'sprint';
      const requestedSprintCount = req.query.sprints ? parseInt(req.query.sprints) : null;

      let issues;
      let sprintCount = 0;
      let currentVersion = null;

      const result = await jiraClient.fetchAllTeamsIssues(requestedSprintCount || 6);
      issues = result.issues;
      sprintCount = result.sprintCount;
      currentVersion = result.currentVersion;

      // Add team information
      const teamLabels = Object.values(TEAMS).map(t => t.label);
      issues.forEach(issue => {
        const labels = issue.fields.labels || [];
        const teamLabel = labels.find(l => teamLabels.includes(l));
        issue.team = teamLabel || 'Unknown';
      });

      const allProcessedData = dataProcessor.processIssues(issues, groupBy);
      const allTableData = dataProcessor.prepareTableData(issues, groupBy);

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
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

function makeRequest(server, path) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: 'localhost',
      port: address.port,
      path: path,
      method: 'GET',
      timeout: 60000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Jirafly Web - API Endpoint Tests\n');
  console.log('='.repeat(60));

  const app = createTestServer();
  const server = app.listen(0); // Random available port

  try {
    // ============================================================
    // TEST 1: Basic API Response
    // ============================================================
    console.log('\n📡 Test 1: Basic API Response\n');

    const response = await makeRequest(server, '/api/data');

    test('Returns 200 status', () => {
      assertEqual(response.status, 200, 'Status code');
    });

    test('Returns JSON object', () => {
      assertTrue(typeof response.data === 'object', 'Response should be an object');
    });

    test('Contains "all" data', () => {
      assertTrue(response.data.all !== undefined, 'Should have "all" property');
    });

    test('Contains teams array', () => {
      assertTrue(Array.isArray(response.data.teams), 'Teams should be an array');
      assertTrue(response.data.teams.length > 0, 'Should have at least one team');
    });

    test('Contains teamData object', () => {
      assertTrue(typeof response.data.teamData === 'object', 'TeamData should be an object');
    });

    test('Contains sprintCount', () => {
      assertTrue(typeof response.data.sprintCount === 'number', 'SprintCount should be a number');
    });

    test('Contains currentVersion', () => {
      assertTrue(typeof response.data.currentVersion === 'string', 'CurrentVersion should be a string');
    });

    // ============================================================
    // TEST 2: All Data Structure
    // ============================================================
    console.log('\n📊 Test 2: All Data Structure\n');

    const allData = response.data.all;

    test('All data has groups', () => {
      assertTrue(Array.isArray(allData.groups), 'Groups should be an array');
      assertTrue(allData.groups.length > 0, 'Should have at least one group');
    });

    test('All data has categories', () => {
      assertTrue(Array.isArray(allData.categories), 'Categories should be an array');
      assertTrue(allData.categories.includes('Product'), 'Should include Product');
      assertTrue(allData.categories.includes('Bug'), 'Should include Bug');
      assertTrue(allData.categories.includes('Maintenance'), 'Should include Maintenance');
      assertTrue(allData.categories.includes('Excluded'), 'Should include Excluded');
    });

    test('All data has hleByGroup', () => {
      assertTrue(typeof allData.hleByGroup === 'object', 'HleByGroup should be an object');
      const firstGroup = allData.groups[0];
      assertTrue(allData.hleByGroup[firstGroup] !== undefined, 'Should have data for first group');
    });

    test('All data has countsByGroup', () => {
      assertTrue(typeof allData.countsByGroup === 'object', 'CountsByGroup should be an object');
    });

    test('All data has tableData', () => {
      assertTrue(Array.isArray(allData.tableData), 'TableData should be an array');
      assertTrue(allData.tableData.length > 0, 'Should have at least one table row');
    });

    test('All data has totalIssues', () => {
      assertTrue(typeof allData.totalIssues === 'number', 'TotalIssues should be a number');
      assertTrue(allData.totalIssues > 0, 'Should have at least one issue');
    });

    // ============================================================
    // TEST 3: HLE Data Integrity
    // ============================================================
    console.log('\n📈 Test 3: HLE Data Integrity\n');

    test('HLE values are valid numbers', () => {
      for (const group of allData.groups) {
        for (const category of allData.categories) {
          const value = allData.hleByGroup[group][category];
          assertTrue(typeof value === 'number', `HLE ${group}/${category} should be number, got ${typeof value}`);
          assertTrue(!isNaN(value), `HLE ${group}/${category} should not be NaN`);
          assertTrue(value !== null, `HLE ${group}/${category} should not be null`);
        }
      }
    });

    test('HLE values are non-negative', () => {
      for (const group of allData.groups) {
        for (const category of allData.categories) {
          assertTrue(allData.hleByGroup[group][category] >= 0,
            `HLE ${group}/${category} should be >= 0`);
        }
      }
    });

    test('Table HLE matches aggregated HLE', () => {
      const tableHLE = allData.tableData.reduce((sum, row) => sum + (row.hle || 0), 0);
      let aggregatedHLE = 0;
      for (const group of allData.groups) {
        for (const cat of allData.categories) {
          aggregatedHLE += allData.hleByGroup[group][cat];
        }
      }
      const diff = Math.abs(tableHLE - aggregatedHLE);
      assertTrue(diff < 0.1, `Table HLE (${tableHLE.toFixed(2)}) should match aggregated (${aggregatedHLE.toFixed(2)})`);
    });

    // ============================================================
    // TEST 4: Team Data Structure
    // ============================================================
    console.log('\n👥 Test 4: Team Data Structure\n');

    const teamLabels = response.data.teams;
    const teamData = response.data.teamData;

    test('Team data exists for at least one team', () => {
      const teamsWithData = Object.keys(teamData);
      assertTrue(teamsWithData.length > 0, 'At least one team should have data');
    });

    test('Team data has correct structure', () => {
      const teamsWithData = Object.keys(teamData);
      if (teamsWithData.length > 0) {
        const firstTeam = teamsWithData[0];
        assertTrue(teamData[firstTeam].processedData !== undefined, 'Should have processedData');
        assertTrue(teamData[firstTeam].tableData !== undefined, 'Should have tableData');
      }
    });

    test('Sum of team issues equals total (approximately)', () => {
      let teamIssueSum = 0;
      Object.values(teamData).forEach(team => {
        teamIssueSum += team.processedData.totalIssues;
      });
      // Some issues might be "Unknown" team
      assertTrue(teamIssueSum <= allData.totalIssues,
        `Team issues (${teamIssueSum}) should be <= total (${allData.totalIssues})`);
    });

    console.log('\n   Teams with data:');
    Object.entries(teamData).forEach(([team, data]) => {
      console.log(`   ${team}: ${data.processedData.totalIssues} issues`);
    });

    // ============================================================
    // TEST 5: Table Data Fields
    // ============================================================
    console.log('\n📋 Test 5: Table Data Fields\n');

    const tableRow = allData.tableData[0];

    test('Table row has sprint', () => {
      assertTrue(tableRow.sprint !== undefined, 'Should have sprint');
    });

    test('Table row has assignee', () => {
      assertTrue(tableRow.assignee !== undefined, 'Should have assignee');
    });

    test('Table row has key', () => {
      assertTrue(tableRow.key !== undefined, 'Should have key');
      assertTrue(/^[A-Z]+-\d+$/.test(tableRow.key), 'Key should match PROJ-123 pattern');
    });

    test('Table row has summary', () => {
      assertTrue(tableRow.summary !== undefined, 'Should have summary');
      assertTrue(tableRow.summary.length <= 80, 'Summary should be max 80 chars');
    });

    test('Table row has hle', () => {
      assertTrue(typeof tableRow.hle === 'number', 'HLE should be a number');
    });

    test('Table row has category', () => {
      assertTrue(tableRow.category !== undefined, 'Should have category');
      assertTrue(['Product', 'Bug', 'Maintenance', 'Excluded'].includes(tableRow.category),
        'Category should be valid');
    });

    test('Table row has status', () => {
      assertTrue(tableRow.status !== undefined, 'Should have status');
    });

    test('Table row has issueType', () => {
      assertTrue(tableRow.issueType !== undefined, 'Should have issueType');
    });

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n  Total tests: ${results.passed + results.failed}`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);

    if (results.failed > 0) {
      console.log('\n  Failed tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`    - ${t.name}: ${t.error}`);
      });
    } else {
      console.log('\n  🎉 All tests passed!\n');
    }

  } finally {
    server.close();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n❌ Test runner error:', error.message);
  process.exit(1);
});
