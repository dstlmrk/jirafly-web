require('dotenv').config();
const JiraClient = require('../../src/jira-client');

async function testSingleIssue() {
  const client = new JiraClient();

  console.log('\n🧪 Test stažení konkrétního issue KNJ-21481...\n');

  try {
    // Test 1: Stáhnout konkrétní issue
    console.log('📡 Stahování: key = KNJ-21481');
    const response = await client.makeRequest('key = KNJ-21481', null, 10);

    console.log(`\n✅ API response:`);
    console.log(`   Počet issues: ${response.issues.length}`);
    console.log(`   isLast: ${response.isLast}`);

    if (response.issues.length > 0) {
      const issue = response.issues[0];
      console.log('\n📋 Issue detail:');
      console.log(`   Key: ${issue.key}`);
      console.log(`   Summary: ${issue.fields?.summary || 'N/A'}`);
      console.log(`   Type: ${issue.fields?.issuetype?.name || 'N/A'}`);
      console.log(`   Status: ${issue.fields?.status?.name || 'N/A'}`);
      console.log(`   Assignee: ${issue.fields?.assignee?.displayName || 'Unassigned'}`);
      console.log(`   Labels: ${issue.fields?.labels?.join(', ') || 'žádné'}`);
      console.log(`   Fix Versions: ${issue.fields?.fixVersions?.map(v => v.name).join(', ') || 'žádné'}`);
      console.log(`   Sprint: ${issue.fields?.customfield_10000?.[0]?.name || 'žádný'}`);
      console.log(`   HLE: ${issue.fields?.customfield_11605 || 'N/A'}`);

      console.log('\n🎉 SUCCESS! Issue se podařilo stáhnout!');
      console.log('\n📝 To znamená, že:');
      console.log('   ✅ API komunikace funguje perfektně');
      console.log('   ✅ Credentials jsou správné');
      console.log('   ✅ Máš přístup k issues v projektu KNJ');

      // Test 2: Zkus stáhnout všechny issues z projektu KNJ
      console.log('\n📡 Stahování: project = KNJ ORDER BY created DESC');
      const projectResponse = await client.makeRequest('project = KNJ ORDER BY created DESC', null, 10);
      console.log(`✅ Project KNJ má ${projectResponse.issues.length} issues (z prvních 10)`);

      if (projectResponse.issues.length > 0) {
        console.log('\n   První 3 issues z projektu KNJ:');
        projectResponse.issues.slice(0, 3).forEach((iss, i) => {
          console.log(`   ${i + 1}. ${iss.key} - ${iss.fields?.summary?.substring(0, 50) || 'N/A'}`);
        });
      }

      console.log('\n💡 Problém byl pravděpodobně s filter ID 18297!');
      console.log('   Zkus v aplikaci použít JQL: "project = KNJ" místo filter ID');

    } else {
      console.log('\n❌ Issue KNJ-21481 se nepodařilo stáhnout!');
      console.log('   Buď neexistuje, nebo k němu nemáš přístup.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSingleIssue();
