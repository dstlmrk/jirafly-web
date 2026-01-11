require('dotenv').config();
const axios = require('axios');

async function testRawJira() {
  const jiraUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

  console.log('\n🧪 Test Jira API s různými variantami...\n');
  console.log(`Jira URL: ${jiraUrl}`);
  console.log(`Email: ${email}`);

  // Test 1: POST na /search/jql
  console.log('\n📡 Test 1: POST /rest/api/3/search/jql');
  try {
    const response1 = await axios.post(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        jql: 'filter=18297',
        startAt: 0,
        maxResults: 10
      },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ SUCCESS! Total: ${response1.data.total}, Issues: ${response1.data.issues?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 2a: GET /search/jql s filter 18297
  console.log('\n📡 Test 2a: GET /search/jql - filter 18297');
  try {
    const response2a = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        params: {
          jql: 'filter=18297',
          startAt: 0,
          maxResults: 10
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response2a.data.issues?.length || 0}, isLast: ${response2a.data.isLast}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 2b: GET /search/jql bez filtru (project nebo assignee)
  console.log('\n📡 Test 2b: GET /search/jql - assignee = currentUser()');
  try {
    const response2b = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        params: {
          jql: 'assignee = currentUser()',
          startAt: 0,
          maxResults: 5
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response2b.data.issues?.length || 0}, isLast: ${response2b.data.isLast}`);
    if (response2b.data.issues?.length > 0) {
      console.log(`   První issue: ${response2b.data.issues[0].key}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 2c: Project based query
  console.log('\n📡 Test 2c: GET /search/jql - project není prázdný');
  try {
    const response2c = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        params: {
          jql: 'project is not EMPTY ORDER BY created DESC',
          startAt: 0,
          maxResults: 5
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response2c.data.issues?.length || 0}, isLast: ${response2c.data.isLast}`);
    if (response2c.data.issues?.length > 0) {
      console.log(`   První issue: ${response2c.data.issues[0].key}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 3: POST na /search (starý endpoint)
  console.log('\n📡 Test 3: POST /rest/api/3/search');
  try {
    const response3 = await axios.post(
      `${jiraUrl}/rest/api/3/search`,
      {
        jql: 'filter=18297',
        startAt: 0,
        maxResults: 10
      },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ SUCCESS! Total: ${response3.data.total}, Issues: ${response3.data.issues?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 4: GET na /search
  console.log('\n📡 Test 4: GET /rest/api/3/search');
  try {
    const response4 = await axios.get(
      `${jiraUrl}/rest/api/3/search`,
      {
        params: {
          jql: 'filter=18297',
          startAt: 0,
          maxResults: 10
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ SUCCESS! Total: ${response4.data.total}, Issues: ${response4.data.issues?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }
}

testRawJira();
