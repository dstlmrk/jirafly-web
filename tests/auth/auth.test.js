require('dotenv').config();
const axios = require('axios');

async function testAuth() {
  const jiraUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  console.log('\n🧪 Testování autentizace a API přístupu...\n');
  console.log(`Jira URL: ${jiraUrl}`);
  console.log(`Email: ${email}`);
  console.log(`Token: ${token.substring(0, 20)}...${token.substring(token.length - 8)}\n`);

  const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

  // Test 1: Get current user
  console.log('📡 Test 1: GET /rest/api/3/myself (ověření autentizace)');
  try {
    const response = await axios.get(`${jiraUrl}/rest/api/3/myself`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    console.log('✅ Autentizace OK!');
    console.log(`   Uživatel: ${response.data.displayName}`);
    console.log(`   Email: ${response.data.emailAddress}`);
    console.log(`   Account ID: ${response.data.accountId}`);
  } catch (error) {
    console.log(`❌ Autentizace selhala: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.status === 401) {
      console.log('   → Token je neplatný nebo vypršel!');
    }
    return;
  }

  // Test 2: Search permissions
  console.log('\n📡 Test 2: GET /rest/api/3/mypermissions');
  try {
    const response = await axios.get(`${jiraUrl}/rest/api/3/mypermissions`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    console.log('✅ Permissions získány');
    const perms = response.data.permissions;
    console.log(`   BROWSE_PROJECTS: ${perms?.BROWSE_PROJECTS?.havePermission}`);
    console.log(`   CREATE_ISSUES: ${perms?.CREATE_ISSUES?.havePermission}`);
    console.log(`   EDIT_ISSUES: ${perms?.EDIT_ISSUES?.havePermission}`);
  } catch (error) {
    console.log(`⚠️  Permissions: ${error.response?.status}`);
  }

  // Test 3: Get projects
  console.log('\n📡 Test 3: GET /rest/api/3/project (seznam projektů)');
  try {
    const response = await axios.get(`${jiraUrl}/rest/api/3/project`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    console.log(`✅ Počet projektů: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log('\n   Dostupné projekty:');
      response.data.slice(0, 5).forEach(project => {
        console.log(`   - ${project.key}: ${project.name}`);
      });

      // Pokud existuje projekt KNJ, zkusíme stáhnout issue
      const knjProject = response.data.find(p => p.key === 'KNJ');
      if (knjProject) {
        console.log(`\n   ✅ Projekt KNJ existuje!`);

        // Test 4: Zkus stáhnout issue KNJ-21481 přes REST API (ne JQL)
        console.log('\n📡 Test 4: GET /rest/api/3/issue/KNJ-21481 (přímé stažení)');
        try {
          const issueResponse = await axios.get(`${jiraUrl}/rest/api/3/issue/KNJ-21481`, {
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/json'
            }
          });

          console.log('✅ Issue KNJ-21481 existuje a byl stažen!');
          console.log(`   Summary: ${issueResponse.data.fields.summary}`);
          console.log(`   Type: ${issueResponse.data.fields.issuetype.name}`);
          console.log(`   Status: ${issueResponse.data.fields.status.name}`);

          console.log('\n🎉 PROBLÉM NALEZEN!');
          console.log('   ✅ Issue existuje a lze ho stáhnout přes /issue endpoint');
          console.log('   ❌ Ale search/jql endpoint ho nevrací');
          console.log('\n   💡 Možná je to omezení JQL search API pro tento účet.');
        } catch (error) {
          console.log(`❌ Issue neexistuje nebo nemáš přístup: ${error.response?.status}`);
        }
      } else {
        console.log(`\n   ⚠️  Projekt KNJ nebyl nalezen v seznamu`);
      }
    }
  } catch (error) {
    console.log(`❌ Projects: ${error.response?.status} - ${error.message}`);
  }
}

testAuth();
