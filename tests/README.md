# JiraFly Web - Testy

Organizovaná struktura testů pro JiraFly Web aplikaci.

## Struktura

```
tests/
├── run-tests.js          # Hlavní test runner
├── README.md             # Dokumentace testů
├── unit/                 # Unit testy (jednotlivé komponenty)
├── integration/          # Integrační testy (celkový workflow)
├── api/                  # API testy (Jira API volání)
├── auth/                 # Autentizační testy
└── manual/               # Manuální utility skripty
```

## Spuštění testů

### Všechny testy
```bash
npm test
```

### Podle kategorie
```bash
npm test:unit          # Pouze unit testy
npm test:integration   # Pouze integrační testy
npm test:api          # Pouze API testy
npm test:auth         # Pouze autentizační testy
```

### Přímo přes test runner
```bash
node tests/run-tests.js              # Všechny testy
node tests/run-tests.js unit         # Jen unit testy
node tests/run-tests.js integration  # Jen integrační testy
```

### Jednotlivý test
```bash
node tests/unit/refactoring.test.js
node tests/api/fields.test.js
```

## Kategorie testů

### 📦 Unit (`tests/unit/`)
Testy jednotlivých komponent a modulů bez závislostí na vnějších službách.

- `refactoring.test.js` - Testuje refaktorované komponenty (config, data-processor, html-template)

### 🔗 Integration (`tests/integration/`)
Testy celkového workflow a integrace mezi komponentami.

- `basic.test.js` - Základní JQL queries
- `working.test.js` - Funkční dotazy s JiraClient
- `general-search.test.js` - Obecné vyhledávání
- `filter-final.test.js` - Testování filtrů

### 🌐 API (`tests/api/`)
Testy přímé komunikace s Jira API.

- `api.test.js` - Základní API testy
- `raw-jira.test.js` - Raw Jira API volání
- `fields.test.js` - Testování polí
- `single-issue.test.js` - Test načtení jednoho issue

### 🔐 Auth (`tests/auth/`)
Testy autentizace a oprávnění.

- `auth.test.js` - Komplexní autentizační test
- `auth-working.test.js` - Funkční autentizace

### 🛠️ Manual (`tests/manual/`)
Utility skripty pro diagnostiku a setup.

- `get-cloud-id.js` - Získání Jira Cloud ID pro scoped tokeny

## Požadavky

### Proměnné prostředí
Všechny testy vyžadují následující proměnné v `.env`:

```env
JIRA_URL=https://your-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

### Generování API tokenu
1. Jdi na https://id.atlassian.com/manage-profile/security/api-tokens
2. Vytvoř nový API token
3. Zkopíruj ho do `.env` souboru

## Psaní nových testů

### Konvence pojmenování
- Soubory: `nazev-testu.test.js`
- Umístění: podle kategorie (`unit/`, `integration/`, `api/`, `auth/`)

### Příklad nového testu
```javascript
require('dotenv').config();
const { createJiraClient, logTestHeader, logTestResult } = require('../../src/test-utils');

async function testMojeNovyTest() {
  logTestHeader('🧪 Test nové funkcionality');

  const client = createJiraClient();

  try {
    // Testovací logika
    const response = await client.get('/rest/api/3/myself');
    logTestResult('Test user info', response.data.displayName !== undefined);
  } catch (error) {
    logTestResult('Test user info', false, error.message);
    process.exit(1);
  }
}

testMojeNovyTest();
```

### Utility pro testy
V `src/test-utils.js` jsou k dispozici pomocné funkce:

- `createJiraClient()` - Vytvoří nakonfigurovaný axios client
- `jiraGet(endpoint, options)` - GET request s error handlingem
- `logTestResult(name, success, message)` - Jednotný formát výstupu
- `logTestHeader(title)` - Hlavička testu
- `printItems(items, formatter, limit)` - Výpis položek

## Output formát

Testy používají barevný výstup:
- ✅ Zelená - Úspěch
- ❌ Červená - Selhání
- ⚠️ Žlutá - Varování
- 📡 Modrá - Info o API volání
- 🧪 Fialová - Test header

## Troubleshooting

### Testy selháví s 401
- Zkontroluj platnost API tokenu v `.env`
- Ověř, že email a token patří k sobě

### Testy selháví s 403
- Uživatel nemá oprávnění k požadovaným datům
- Zkontroluj project permissions v Jira

### Testy selháví s 404
- URL/endpoint neexistuje
- Zkontroluj `JIRA_URL` v `.env`

### No issues found
- Zkus jiné JQL query
- Ověř si přístup k projektům v Jira UI

## Údržba

### Mazání zastaralých testů
Pokud test už není potřeba:
1. Smaž soubor z příslušné kategorie
2. Test runner ho automaticky přeskočí

### Reorganizace
Pokud test patří do jiné kategorie, přesuň ho:
```bash
mv tests/api/muj-test.test.js tests/integration/muj-test.test.js
```

## Další kroky

Pro budoucí vylepšení zvážit:
- [ ] Přidání skutečného test frameworku (Jest, Mocha)
- [ ] Automatizované asserty místo console.log
- [ ] Mock Jira API pro unit testy
- [ ] CI/CD integrace
- [ ] Code coverage reporting
