require('dotenv').config();
const axios = require('axios');

async function testWithFields() {
  const jiraUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

  console.log('\n🧪 Test s různými fields parametry...\n');

  // Test s fields=*all
  console.log('📡 Test 1: fields=*all');
  try {
    const response1 = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        params: {
          jql: 'filter=18297',
          fields: '*all'
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response1.data.issues?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
  }

  // Test s fields jako array (key,summary)
  console.log('\n📡 Test 2: fields=key,summary');
  try {
    const response2 = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql`,
      {
        params: {
          jql: 'filter=18297',
          fields: 'key,summary'
        },
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response2.data.issues?.length || 0}`);
    if (response2.data.issues?.length > 0) {
      console.log(`   První: ${response2.data.issues[0].key}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
  }

  // Test úplně bez params (jen JQL)
  console.log('\n📡 Test 3: jen JQL v URL');
  try {
    const jql = encodeURIComponent('filter=18297');
    const response3 = await axios.get(
      `${jiraUrl}/rest/api/3/search/jql?jql=${jql}`,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Issues: ${response3.data.issues?.length || 0}`);
    if (response3.data.issues?.length > 0) {
      console.log(`   První: ${response3.data.issues[0].key}`);
      console.log(`   Response keys:`, Object.keys(response3.data));
    } else {
      console.log(`   Response:`, JSON.stringify(response3.data));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
  }

  // Test - zkusím získat info o filtru přímo
  console.log('\n📡 Test 4: GET filter info');
  try {
    const response4 = await axios.get(
      `${jiraUrl}/rest/api/3/filter/18297`,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Filter existuje!`);
    console.log(`   Name: ${response4.data.name}`);
    console.log(`   JQL: ${response4.data.jql}`);
    console.log(`   Owner: ${response4.data.owner?.displayName}`);
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.status === 404) {
      console.log('   Filter 18297 neexistuje nebo k němu nemáš přístup!');
    }
  }
}

testWithFields();
