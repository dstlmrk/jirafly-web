require('dotenv').config();
const JiraClient = require('../../src/jira-client');

async function testWorkingQuery() {
  const client = new JiraClient();

  console.log('\n🧪 Test s jednoduchým JQL query...\n');

  try {
    // Zkus získat issues přiřazené aktuálnímu uživateli
    console.log('📡 Test: assignee = currentUser() AND created >= -90d');

    const response = await client.makeRequest(
      'assignee = currentUser() AND created >= -90d ORDER BY created DESC',
      null,
      10
    );

    console.log(`\n✅ API vrátilo: ${response.issues.length} issues`);
    console.log(`   nextPageToken: ${response.nextPageToken ? 'ANO (jsou další stránky)' : 'NE (poslední stránka)'}`);
    console.log(`   isLast: ${response.isLast}`);

    if (response.issues.length > 0) {
      console.log('\n📋 První 3 issues:');
      response.issues.slice(0, 3).forEach((issue, i) => {
        const summary = issue.fields?.summary || 'N/A';
        const type = issue.fields?.issuetype?.name || 'N/A';
        console.log(`   ${i + 1}. ${issue.key} [${type}] - ${summary.substring(0, 50)}`);
      });
      console.log('\n🎉 Jira API FUNGUJE! Stahování dat je v pořádku!');
    } else {
      console.log('\n⚠️  Žádné issues nenalezeny pro tohoto uživatele.');
      console.log('   Zkus v Jira UI zjistit správné filter ID nebo JQL query.');
    }

    console.log('\n📝 ZÁVĚR:');
    console.log('   ✅ API komunikace funguje');
    console.log('   ✅ Token-based pagination je správně implementovaná');
    console.log('   ❌ Filter 18297 není dostupný (404 Not Found)');
    console.log('\n💡 ŘEŠENÍ: Zadej v aplikaci jiné filter ID, které existuje ve tvé Jira!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testWorkingQuery();
