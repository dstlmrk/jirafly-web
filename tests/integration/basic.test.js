require('dotenv').config();
const axios = require('axios');

async function testBasicQueries() {
  const jiraUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

  console.log('\n🧪 Testování různých JQL queries...\n');
  console.log(`Jira URL: ${jiraUrl}`);
  console.log(`Email: ${email}\n`);

  const queries = [
    'type = Bug',
    'type = Story',
    'type = Task',
    'created >= -7d',
    'updated >= -7d',
    'project = MP', // Zkus různé project keys
    'project = MALL',
    'project = PAY'
  ];

  for (const jql of queries) {
    try {
      const response = await axios.get(
        `${jiraUrl}/rest/api/3/search/jql`,
        {
          params: { jql, maxResults: 5 },
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        }
      );

      const count = response.data.issues?.length || 0;
      console.log(`${count > 0 ? '✅' : '⚠️ '} JQL: "${jql}" → ${count} issues`);

      if (count > 0) {
        const firstIssue = response.data.issues[0];
        console.log(`   První: ${firstIssue.key} - ${firstIssue.fields?.summary?.substring(0, 40) || 'N/A'}`);
      }
    } catch (error) {
      console.log(`❌ JQL: "${jql}" → Error: ${error.response?.status || error.message}`);
    }
  }

  console.log('\n📝 Pokud všechny query vrací 0, uživatel možná nemá přístup k žádným issues v této Jira instanci.');
}

testBasicQueries();
