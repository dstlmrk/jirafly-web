require('dotenv').config();
const axios = require('axios');

async function getCloudId() {
  const url = process.env.JIRA_URL;

  console.log('Zjišťuji Cloud ID...\n');

  try {
    // Tento endpoint nefunguje s autentizací, je veřejný
    const tenantUrl = `${url}_edge/tenant_info`;
    console.log('URL:', tenantUrl);

    const response = await axios.get(tenantUrl);
    console.log('✅ Cloud ID:', response.data.cloudId);
    console.log('');
    console.log('Nová API URL bude:');
    console.log(`https://api.atlassian.com/ex/jira/${response.data.cloudId}/rest/api/3/`);

    return response.data.cloudId;
  } catch (error) {
    console.log('❌ Chyba:', error.message);
    console.log('');
    console.log('💡 Alternativní způsob:');
    console.log('1. Jdi na: https://mallpay.atlassian.net/_edge/tenant_info');
    console.log('2. Najdi "cloudId" v JSON odpovědi');
    console.log('3. Použij ho v nové URL: https://api.atlassian.com/ex/jira/{cloudId}/');
  }
}

getCloudId();
