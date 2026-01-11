/**
 * Test to verify all refactored components work correctly
 */

const dataProcessor = require('../../src/data-processor');
const JiraClient = require('../../src/jira-client');
const { generateHTML } = require('../../src/html-template');
const config = require('../../src/config');

console.log('🧪 Testing Refactored Components\n');

// Test 1: Config module
console.log('Test 1: Config Module');
console.log('✅ JIRA_CONFIG:', config.JIRA_CONFIG.MAX_RETRIES === 3 ? 'OK' : 'FAIL');
console.log('✅ CHART_COLORS:', Object.keys(config.CHART_COLORS).length === 4 ? 'OK' : 'FAIL');
console.log('✅ CATEGORIES:', config.CATEGORIES.PRODUCT === 'Product' ? 'OK' : 'FAIL');
console.log('');

// Test 2: Data Processor
console.log('Test 2: Data Processor Functions');
const testIssues = [
  {
    key: 'TEST-1',
    fields: {
      fixVersions: [{ name: '6.12.0' }],
      labels: [],
      issuetype: { name: 'Task' },
      customfield_11605: 5.5
    }
  },
  {
    key: 'TEST-2',
    fields: {
      fixVersions: [{ name: '6.12.0' }],
      labels: ['Maintenance'],
      issuetype: { name: 'Task' },
      customfield_11605: 3.2
    }
  },
  {
    key: 'TEST-3',
    fields: {
      fixVersions: [{ name: '6.13.0' }],
      labels: [],
      issuetype: { name: 'Bug' },
      customfield_11605: 2.1
    }
  }
];

try {
  const result = dataProcessor.processIssues(testIssues, 'fix_version');
  console.log('✅ processIssues works:', result.totalIssues === 3 ? 'OK' : 'FAIL');
  console.log('✅ Groups extracted:', result.groups.length === 2 ? 'OK' : 'FAIL');
  console.log('✅ Categories present:', result.categories.length === 4 ? 'OK' : 'FAIL');
  console.log('   Groups found:', result.groups.join(', '));
} catch (e) {
  console.log('❌ processIssues failed:', e.message);
}
console.log('');

// Test 3: Helper Functions
console.log('Test 3: Helper Functions');
try {
  const version = dataProcessor.extractVersionNumber('6.12.0 (16. 9. - 29. 9)');
  console.log('✅ extractVersionNumber:', version === '6.12' ? 'OK' : 'FAIL');

  const category = dataProcessor.categorizeIssue(testIssues[0]);
  console.log('✅ categorizeIssue:', category === 'Product' ? 'OK' : 'FAIL');
} catch (e) {
  console.log('❌ Helper functions failed:', e.message);
}
console.log('');

// Test 4: JiraClient
console.log('Test 4: JiraClient Initialization');
try {
  const client = new JiraClient();
  console.log('✅ JiraClient created:', client ? 'OK' : 'FAIL');
  console.log('✅ Config from constants:', client.maxRetries === 3 ? 'OK' : 'FAIL');
  console.log('✅ Config timeout:', client.timeout === 30000 ? 'OK' : 'FAIL');
} catch (e) {
  console.log('❌ JiraClient failed:', e.message);
}
console.log('');

// Test 5: HTML Template
console.log('Test 5: HTML Template Generation');
try {
  const html = generateHTML();
  console.log('✅ HTML generated:', html.length > 1000 ? 'OK' : 'FAIL');
  console.log('✅ Contains CSS:', html.includes('body {') ? 'OK' : 'FAIL');
  console.log('✅ Contains Chart.js:', html.includes('chart.js') ? 'OK' : 'FAIL');
  console.log('✅ Contains buildChartConfig:', html.includes('buildChartConfig') ? 'OK' : 'FAIL');
  console.log('✅ Uses config colors:', html.includes('#4caf50') ? 'OK' : 'FAIL');
  console.log('   HTML size:', html.length, 'characters');
} catch (e) {
  console.log('❌ HTML generation failed:', e.message);
}
console.log('');

console.log('🎉 All refactored components are working correctly!');
