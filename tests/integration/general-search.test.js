require('dotenv').config();
const axios = require('axios');

async function testGeneralSearch() {
  const token = process.env.JIRA_API_TOKEN;
  const url = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;

  const credentials = `${email}:${token}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');

  const headers = {
    'Authorization': `Basic ${base64Credentials}`,
    'Accept': 'application/json'
  };

  console.log('Test různých JQL queries...\n');

  // Test 1: Obecný search
  console.log('Test 1: project != empty');
  try {
    const response = await axios.get(`${url}/rest/api/3/search`, {
      headers,
      params: {
        jql: 'project != empty',
        maxResults: '3',
        fields: 'summary,project'
      }
    });
    console.log('✅ OK - Total:', response.data.total, ', Returned:', response.data.issues?.length);
    if (response.data.issues && response.data.issues.length > 0) {
      response.data.issues.forEach(issue => {
        console.log('  -', issue.key, issue.fields.project.name);
      });
    }
  } catch (error) {
    console.log('❌', error.response?.status, error.response?.data?.errorMessages);
  }

  console.log('');

  // Test 2: Filter 18297 přes /search endpoint
  console.log('Test 2: filter=18297 přes /search');
  try {
    const response = await axios.get(`${url}/rest/api/3/search`, {
      headers,
      params: {
        jql: 'filter=18297',
        maxResults: '3',
        fields: 'summary'
      }
    });
    console.log('✅ OK - Total:', response.data.total, ', Returned:', response.data.issues?.length);
  } catch (error) {
    console.log('❌', error.response?.status, error.response?.data?.errorMessages);
  }

  console.log('');

  // Test 3: Filter 18297 přes /search/jql
  console.log('Test 3: filter=18297 přes /search/jql');
  try {
    const response = await axios.get(`${url}/rest/api/3/search/jql`, {
      headers,
      params: {
        jql: 'filter=18297',
        maxResults: '3',
        fields: 'summary'
      }
    });
    console.log('✅ OK - Total:', response.data.total, ', Returned:', response.data.issues?.length);
  } catch (error) {
    console.log('❌', error.response?.status, error.response?.data?.errorMessages);
  }

  console.log('');
  console.log('💡 Závěr:');
  console.log('Pokud ani obecný JQL nefunguje, problém je v tom, že scoped token');
  console.log('nemá přístup k PROJECT datům, ne k filtru samotnému.');
}

testGeneralSearch();
