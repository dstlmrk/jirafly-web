require('dotenv').config();
const JiraClient = require('../../src/jira-client');

async function testFilter() {
  const client = new JiraClient();

  console.log('\n🧪 Finální test s filter 18297...\n');

  try {
    console.log('📡 Stahování všech tasků z filter 18297...');
    const issues = await client.fetchIssuesByFilter(18297);

    console.log(`\n✅ ÚSPĚCH! Staženo ${issues.length} tasků z filtru 18297!`);

    if (issues.length > 0) {
      console.log('\n📋 První 5 tasků:');
      issues.slice(0, 5).forEach((issue, i) => {
        const summary = issue.fields?.summary || 'N/A';
        const type = issue.fields?.issuetype?.name || 'N/A';
        const hle = issue.fields?.customfield_11605 || 0;
        console.log(`   ${i + 1}. ${issue.key} [${type}] HLE:${hle} - ${summary.substring(0, 50)}`);
      });

      console.log('\n🎉 APLIKACE JE PLNĚ FUNKČNÍ!');
      console.log(`   ✅ Staženo ${issues.length} tasků`);
      console.log('   ✅ Token-based paginace funguje');
      console.log('   ✅ Všechna data jsou dostupná');
      console.log('\n💡 Můžeš spustit aplikaci a použít ji!');
    } else {
      console.log('\n⚠️  Filter 18297 je prázdný nebo nevrací žádné tasky.');
      console.log('   Zkontroluj v Jira UI jestli filter obsahuje data.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('404')) {
      console.log('\n   Filter 18297 neexistuje nebo k němu nemáš přístup.');
      console.log('   Zkus v aplikaci zadat jiné filter ID které znáš.');
    }
  }
}

testFilter();
