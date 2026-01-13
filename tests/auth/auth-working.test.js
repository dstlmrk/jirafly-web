const { jiraGet, logTestHeader, logTestResult, printItems } = require('../../src/test-utils');

async function testAuth() {
  logTestHeader('Testing Jira API authentication...');

  const myselfResult = await jiraGet('/rest/api/3/myself', {});
  logTestResult('Test 1: GET /rest/api/3/myself', myselfResult.success);

  if (myselfResult.success) {
    console.log('Přihlášený uživatel:', myselfResult.data.displayName);
    console.log('Email:', myselfResult.data.emailAddress);
    console.log('');
  } else {
    console.log('Error:', myselfResult.status, myselfResult.error);
    return;
  }

  const myFiltersResult = await jiraGet('/rest/api/3/filter/my', {});
  logTestResult('Test 2: GET /rest/api/3/filter/my', myFiltersResult.success);

  if (myFiltersResult.success) {
    console.log('✅ Tvoje filtry:');
    printItems(myFiltersResult.data, filter => `ID: ${filter.id}, Name: ${filter.name}`);
    console.log('');
  } else {
    console.log('❌ Error:', myFiltersResult.status, myFiltersResult.error);
  }

  const favFiltersResult = await jiraGet('/rest/api/3/filter/favourite', {});
  logTestResult('Test 3: GET /rest/api/3/filter/favourite', favFiltersResult.success);

  if (favFiltersResult.success) {
    console.log('✅ Tvoje oblíbené filtry:');
    printItems(favFiltersResult.data, filter => `ID: ${filter.id}, Name: ${filter.name}`);
  } else {
    console.log('❌ Error:', favFiltersResult.status, favFiltersResult.error);
  }
}

testAuth();
