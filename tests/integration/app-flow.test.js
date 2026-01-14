/**
 * End-to-end integration tests for Jirafly Web
 * Tests the complete application flow from data fetching to processing
 */

require('dotenv').config();
const JiraClient = require('../../src/jira-client');
const dataProcessor = require('../../src/data-processor');
const { generateHTML } = require('../../src/html-template');
const { CATEGORIES, LABELS, TEAMS } = require('../../src/config');

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

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(`${message}: ${item} not found in [${array.join(', ')}]`);
  }
}

async function runTests() {
  console.log('\n🧪 Jirafly Web - Integration Tests\n');
  console.log('='.repeat(60));

  // ============================================================
  // TEST 1: Jira Data Fetching
  // ============================================================
  console.log('\n📡 Test 1: Jira Data Fetching\n');

  const client = new JiraClient();
  let fetchResult;

  try {
    fetchResult = await client.fetchAllTeamsIssues(6);

    test('Fetches issues array', () => {
      assertTrue(Array.isArray(fetchResult.issues), 'Issues should be an array');
    });

    test('Returns non-empty issues', () => {
      assertTrue(fetchResult.issues.length > 0, 'Should fetch at least some issues');
    });

    test('Returns sprint count', () => {
      assertTrue(typeof fetchResult.sprintCount === 'number', 'Sprint count should be a number');
      assertTrue(fetchResult.sprintCount > 0, 'Sprint count should be positive');
    });

    test('Returns current version', () => {
      assertTrue(typeof fetchResult.currentVersion === 'string', 'Current version should be a string');
      assertTrue(/^\d+\.\d+$/.test(fetchResult.currentVersion), 'Current version should match X.Y pattern');
    });

    test('Issues have required fields', () => {
      const issue = fetchResult.issues[0];
      assertTrue(issue.key !== undefined, 'Issue should have key');
      assertTrue(issue.fields !== undefined, 'Issue should have fields');
      assertTrue(issue.fields.summary !== undefined, 'Issue should have summary');
      assertTrue(issue.fields.issuetype !== undefined, 'Issue should have issuetype');
    });

    console.log(`\n   Fetched ${fetchResult.issues.length} issues from ${fetchResult.sprintCount} sprints`);
    console.log(`   Current version: ${fetchResult.currentVersion}`);

  } catch (error) {
    console.log(`  ❌ Failed to fetch data: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Jira data fetching', passed: false, error: error.message });
  }

  // ============================================================
  // TEST 2: Data Processing - Categories
  // ============================================================
  console.log('\n📊 Test 2: Data Processing - Categories\n');

  if (fetchResult && fetchResult.issues.length > 0) {
    const issues = fetchResult.issues;

    test('Categorizes Excluded issues correctly', () => {
      const excludedIssue = {
        fields: {
          labels: ['RatioExcluded'],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(excludedIssue), CATEGORIES.EXCLUDED, 'RatioExcluded label');
    });

    test('Categorizes Bughunting as Excluded', () => {
      const bughuntingIssue = {
        fields: {
          labels: ['Bughunting'],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(bughuntingIssue), CATEGORIES.EXCLUDED, 'Bughunting label');
    });

    test('Categorizes Maintenance issues correctly', () => {
      const maintenanceIssue = {
        fields: {
          labels: ['Maintenance'],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(maintenanceIssue), CATEGORIES.MAINTENANCE, 'Maintenance label');
    });

    test('DevOps alone is NOT Maintenance', () => {
      const devopsIssue = {
        fields: {
          labels: ['DevOps'],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(devopsIssue), CATEGORIES.PRODUCT, 'DevOps alone should be Product');
    });

    test('Categorizes Bug issues correctly', () => {
      const bugIssue = {
        fields: {
          labels: [],
          issuetype: { name: 'Bug' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(bugIssue), CATEGORIES.BUG, 'Bug type');
    });

    test('Categorizes Product issues correctly', () => {
      const productIssue = {
        fields: {
          labels: [],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(productIssue), CATEGORIES.PRODUCT, 'Default category');
    });

    test('Category priority: Excluded > Maintenance', () => {
      const issue = {
        fields: {
          labels: ['RatioExcluded', 'Maintenance'],
          issuetype: { name: 'Task' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(issue), CATEGORIES.EXCLUDED, 'Excluded takes priority');
    });

    test('Category priority: Maintenance > Bug', () => {
      const issue = {
        fields: {
          labels: ['Maintenance'],
          issuetype: { name: 'Bug' }
        }
      };
      assertEqual(dataProcessor.categorizeIssue(issue), CATEGORIES.MAINTENANCE, 'Maintenance takes priority over Bug type');
    });
  }

  // ============================================================
  // TEST 3: Data Processing - Aggregation
  // ============================================================
  console.log('\n📈 Test 3: Data Processing - Aggregation\n');

  if (fetchResult && fetchResult.issues.length > 0) {
    const processed = dataProcessor.processIssues(fetchResult.issues, 'sprint');

    test('Returns groups array', () => {
      assertTrue(Array.isArray(processed.groups), 'Groups should be an array');
      assertTrue(processed.groups.length > 0, 'Should have at least one group');
    });

    test('Groups are version numbers', () => {
      processed.groups.forEach(group => {
        if (group !== 'Ungrouped') {
          assertTrue(/^\d+\.\d+$/.test(group), `Group ${group} should match X.Y pattern`);
        }
      });
    });

    test('Returns categories array', () => {
      assertTrue(Array.isArray(processed.categories), 'Categories should be an array');
      assertContains(processed.categories, CATEGORIES.PRODUCT, 'Should include Product');
      assertContains(processed.categories, CATEGORIES.BUG, 'Should include Bug');
      assertContains(processed.categories, CATEGORIES.MAINTENANCE, 'Should include Maintenance');
      assertContains(processed.categories, CATEGORIES.EXCLUDED, 'Should include Excluded');
    });

    test('HLE values are numbers (not NaN or null)', () => {
      for (const group of processed.groups) {
        for (const category of processed.categories) {
          const value = processed.hleByGroup[group][category];
          assertTrue(typeof value === 'number', `HLE for ${group}/${category} should be number`);
          assertTrue(!isNaN(value), `HLE for ${group}/${category} should not be NaN`);
        }
      }
    });

    test('HLE values are non-negative', () => {
      for (const group of processed.groups) {
        for (const category of processed.categories) {
          assertTrue(processed.hleByGroup[group][category] >= 0,
            `HLE for ${group}/${category} should be >= 0`);
        }
      }
    });

    test('Total issues count matches', () => {
      assertEqual(processed.totalIssues, fetchResult.issues.length, 'Total issues should match');
    });

    console.log(`\n   Processed ${processed.groups.length} groups`);
    console.log(`   Groups: ${processed.groups.join(', ')}`);
  }

  // ============================================================
  // TEST 4: Table Data Preparation
  // ============================================================
  console.log('\n📋 Test 4: Table Data Preparation\n');

  if (fetchResult && fetchResult.issues.length > 0) {
    const tableData = dataProcessor.prepareTableData(fetchResult.issues, 'sprint');

    test('Returns array of table rows', () => {
      assertTrue(Array.isArray(tableData), 'Table data should be an array');
      assertTrue(tableData.length > 0, 'Should have at least one row');
    });

    test('Table rows have required fields', () => {
      const row = tableData[0];
      assertTrue(row.sprint !== undefined, 'Row should have sprint');
      assertTrue(row.assignee !== undefined, 'Row should have assignee');
      assertTrue(row.key !== undefined, 'Row should have key');
      assertTrue(row.summary !== undefined, 'Row should have summary');
      assertTrue(row.hle !== undefined, 'Row should have hle');
      assertTrue(row.category !== undefined, 'Row should have category');
      assertTrue(row.status !== undefined, 'Row should have status');
    });

    test('Table data is sorted by sprint descending', () => {
      for (let i = 1; i < Math.min(tableData.length, 10); i++) {
        const prev = tableData[i - 1].sprint;
        const curr = tableData[i].sprint;
        if (prev !== 'Ungrouped' && curr !== 'Ungrouped' && prev !== curr) {
          assertTrue(prev >= curr, `Sprint ${prev} should be >= ${curr} (descending order)`);
        }
      }
    });

    test('HLE values in table match processed totals', () => {
      const tableHLE = tableData.reduce((sum, row) => sum + (row.hle || 0), 0);
      const processed = dataProcessor.processIssues(fetchResult.issues, 'sprint');
      let processedHLE = 0;
      for (const group of processed.groups) {
        for (const cat of processed.categories) {
          processedHLE += processed.hleByGroup[group][cat];
        }
      }
      // Allow small floating point differences
      assertTrue(Math.abs(tableHLE - processedHLE) < 0.01,
        `Table HLE (${tableHLE}) should match processed HLE (${processedHLE})`);
    });

    console.log(`\n   Prepared ${tableData.length} table rows`);
  }

  // ============================================================
  // TEST 5: HTML Template Generation
  // ============================================================
  console.log('\n🌐 Test 5: HTML Template Generation\n');

  const html = generateHTML({ jiraUrl: process.env.JIRA_URL });

  test('Generates HTML string', () => {
    assertTrue(typeof html === 'string', 'HTML should be a string');
    assertTrue(html.length > 1000, 'HTML should be substantial');
  });

  test('Contains DOCTYPE', () => {
    assertTrue(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
  });

  test('Contains Chart.js', () => {
    assertTrue(html.includes('chart.js'), 'Should include Chart.js');
  });

  test('Contains team toggle button', () => {
    assertTrue(html.includes('teamToggle'), 'Should have team toggle');
  });

  test('Contains percentage chart', () => {
    assertTrue(html.includes('percentageChart'), 'Should have percentage chart');
  });

  test('Contains HLE chart', () => {
    assertTrue(html.includes('hleChart'), 'Should have HLE chart');
  });

  test('Contains issues table', () => {
    assertTrue(html.includes('issuesTable'), 'Should have issues table');
  });

  test('Contains JetBrains Mono font', () => {
    assertTrue(html.includes('JetBrains Mono'), 'Should use JetBrains Mono font');
  });

  test('Contains team name conversion functions', () => {
    assertTrue(html.includes('toFullTeamName'), 'Should have toFullTeamName function');
    assertTrue(html.includes('toShortTeamName'), 'Should have toShortTeamName function');
  });

  test('Y-axis starts from 0', () => {
    assertTrue(html.includes('min: 0'), 'Percentage chart Y-axis should start from 0');
  });

  test('Contains Analysis badge styling', () => {
    assertTrue(html.includes('task-type-analysis'), 'Should have Analysis badge class');
  });

  console.log(`\n   Generated HTML: ${html.length} characters`);

  // ============================================================
  // TEST 6: Percentage Calculations
  // ============================================================
  console.log('\n📐 Test 6: Percentage Calculations\n');

  if (fetchResult && fetchResult.issues.length > 0) {
    const processed = dataProcessor.processIssues(fetchResult.issues, 'sprint');
    const categories = ['Maintenance', 'Bug', 'Product']; // Excluded is not in percentages

    test('Percentages sum to 100% for each sprint', () => {
      for (const group of processed.groups) {
        const total = categories.reduce((sum, cat) => sum + (processed.hleByGroup[group][cat] || 0), 0);
        if (total > 0) {
          let percentSum = 0;
          categories.forEach(cat => {
            const perc = Math.round((processed.hleByGroup[group][cat] || 0) / total * 1000) / 10;
            percentSum += perc;
          });
          // Allow for rounding errors (99.9% - 100.1%)
          assertTrue(percentSum >= 99.5 && percentSum <= 100.5,
            `Sprint ${group} percentages sum to ${percentSum}%, should be ~100%`);
        }
      }
    });

    console.log('\n   Percentage breakdown by sprint:');
    for (const group of processed.groups.slice(-3)) { // Show last 3 sprints
      const total = categories.reduce((sum, cat) => sum + (processed.hleByGroup[group][cat] || 0), 0);
      if (total > 0) {
        const percs = categories.map(cat => {
          const perc = Math.round((processed.hleByGroup[group][cat] || 0) / total * 1000) / 10;
          return `${cat.charAt(0)}:${perc}%`;
        });
        console.log(`   ${group}: ${percs.join(' ')}`);
      }
    }
  }

  // ============================================================
  // TEST 7: Team Filtering
  // ============================================================
  console.log('\n👥 Test 7: Team Filtering\n');

  if (fetchResult && fetchResult.issues.length > 0) {
    const teamLabels = Object.values(TEAMS).map(t => t.label);

    // Add team info to issues
    fetchResult.issues.forEach(issue => {
      const labels = issue.fields.labels || [];
      const teamLabel = labels.find(l => teamLabels.includes(l));
      issue.team = teamLabel || 'Unknown';
    });

    test('Issues have team assigned', () => {
      const withTeam = fetchResult.issues.filter(i => i.team !== 'Unknown');
      assertTrue(withTeam.length > 0, 'At least some issues should have a team');
    });

    test('Team filtering works', () => {
      const teamIssues = {};
      teamLabels.forEach(label => {
        teamIssues[label] = fetchResult.issues.filter(i => i.team === label);
      });

      const totalTeamIssues = Object.values(teamIssues).reduce((sum, arr) => sum + arr.length, 0);
      const unknownIssues = fetchResult.issues.filter(i => i.team === 'Unknown').length;

      assertEqual(totalTeamIssues + unknownIssues, fetchResult.issues.length,
        'Sum of team issues should equal total');
    });

    const teamCounts = {};
    teamLabels.forEach(label => {
      teamCounts[label] = fetchResult.issues.filter(i => i.team === label).length;
    });
    console.log('\n   Issues by team:');
    Object.entries(teamCounts).forEach(([team, count]) => {
      if (count > 0) {
        console.log(`   ${team}: ${count}`);
      }
    });
  }

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
    process.exit(1);
  } else {
    console.log('\n  🎉 All tests passed!\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test runner error:', error.message);
  process.exit(1);
});
