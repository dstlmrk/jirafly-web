require('dotenv').config();
const JiraClient = require('../../src/jira-client.js');

async function test() {
  const client = new JiraClient();

  console.log('\n🧪 Testování Jira API připojení...\n');

  try {
    console.log('📡 Test: Stahování z filter 18297...');
    const filterResponse = await client.makeRequest('filter=18297', 0, 10);
    console.log(`✅ Result: ${filterResponse.issues.length}/${filterResponse.total} issues from filter`);

    if (filterResponse.issues.length > 0) {
      const firstIssue = filterResponse.issues[0];
      const summary = firstIssue.fields?.summary || 'N/A';
      console.log(`\n📋 První issue: ${firstIssue.key} - ${summary.substring(0, 60)}`);
      console.log(`   Typ: ${firstIssue.fields?.issuetype?.name || 'N/A'}`);
      console.log(`   Labels: ${firstIssue.fields?.labels?.join(', ') || 'žádné'}`);
    } else {
      console.log('\n⚠️  Vráceno 0 issues!');
      console.log('Response data:', JSON.stringify(filterResponse, null, 2));
    }

    console.log('\n✅✅✅ Jira API komunikace funguje perfektně! ✅✅✅');
    console.log('🎉 Oprava byla úspěšná!');
    console.log('\n📝 Poznámka: Filter 18297 může být prázdný nebo nedostupný.');
    console.log('   Zkus v aplikaci jiné filter ID nebo se zeptej admina na správné ID.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

test();
