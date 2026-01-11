# 🦋 Jirafly Web

Webová aplikace pro analýzu distribuce Jira tasků podle kategorií a fix verzí/sprintů.

## Popis

Jirafly stahuje tasky z Jiry přes API, roztřídí je do kategorií (Excluded, Maintenance, Bug, Product) a zobrazí jejich rozložení ve dvou interaktivních grafech:

1. **Procentuální rozložení** - poměr kategorií v jednotlivých verzích/sprintech
2. **Absolutní HLE hodnoty** - součty High Level Estimate hodnot podle kategorií

## Funkce

- ✅ Stahování tasků z Jira filtru přes REST API
- ✅ Automatická kategorizace podle labelů a typu
- ✅ Seskupení podle fix verze nebo sprintu
- ✅ Interaktivní grafy s Chart.js
- ✅ Vyloučení Epic tasků
- ✅ Paginace pro velké datasety
- ✅ Bezpečné uložení credentials na serveru

## Požadavky

- **Node.js** 18.0.0 nebo vyšší
- **Jira API Token** - vygenerovat v Jira nastavení
- **Jira Email** - email propojený s Jira účtem

## Instalace

1. **Naklonovat repozitář** (nebo použít stávající):
   ```bash
   cd jirafly-web
   ```

2. **Nainstalovat závislosti**:
   ```bash
   npm install
   ```

3. **Nakonfigurovat .env soubor**:

   Soubor `.env` již existuje a obsahuje:
   ```env
   JIRA_URL=https://mallpay.atlassian.net/
   JIRA_EMAIL=your.email@example.com
   JIRA_API_TOKEN=your_jira_token_here
   PORT=3000
   ```

   ⚠️ **Důležité**: Zkontroluj, že máš správný email a token!

## Spuštění

### Development mode (s auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server poběží na: **http://localhost:3000**

## 🐳 Docker

Aplikaci lze jednoduše spustit v Docker kontejneru.

### Předpoklady
- Docker 20.10+ nainstalovaný
- Docker Compose 2.0+ (volitelné, ale doporučené)

### Spuštění s Docker Compose (doporučeno)

1. **Ujisti se, že máš nakonfigurovaný `.env` soubor** (viz sekce Instalace)

2. **Build a spuštění jedním příkazem**:
   ```bash
   docker-compose up --build
   ```

3. **Spuštění na pozadí (detached mode)**:
   ```bash
   docker-compose up -d
   ```

4. **Zastavení**:
   ```bash
   docker-compose down
   ```

5. **Zobrazení logů**:
   ```bash
   docker-compose logs -f
   ```

### Spuštění s čistým Dockerem

1. **Build image**:
   ```bash
   docker build -t jirafly-web .
   ```

2. **Spuštění kontejneru**:
   ```bash
   docker run -d \
     --name jirafly-web \
     -p 3000:3000 \
     -e JIRA_URL=https://mallpay.atlassian.net/ \
     -e JIRA_EMAIL=your.email@example.com \
     -e JIRA_API_TOKEN=your_token_here \
     jirafly-web
   ```

   **Nebo s `.env` souborem**:
   ```bash
   docker run -d \
     --name jirafly-web \
     -p 3000:3000 \
     --env-file .env \
     jirafly-web
   ```

3. **Zobrazení logů**:
   ```bash
   docker logs -f jirafly-web
   ```

4. **Zastavení a odstranění**:
   ```bash
   docker stop jirafly-web
   docker rm jirafly-web
   ```

### Docker vlastnosti

- ✅ **Multi-stage build** - optimalizovaná velikost image (~150 MB)
- ✅ **Non-root user** - běží jako nodejs user (bezpečnost)
- ✅ **Health check** - automatická kontrola stavu aplikace
- ✅ **Read-only filesystem** - zvýšená bezpečnost
- ✅ **Logging** - rotace logů (max 10MB, 3 soubory)
- ✅ **Alpine Linux** - minimální base image

### Změna portu

Pro spuštění na jiném portu než 3000:

**Docker Compose:**
```bash
PORT=8080 docker-compose up
```

**Docker:**
```bash
docker run -d -p 8080:3000 --env-file .env jirafly-web
```

## Použití

1. Otevři prohlížeč na `http://localhost:3000`
2. Zadej **Filter ID** (výchozí: 18297)
3. Vyber **Group by**:
   - `Fix Version` - seskupí podle fixVersions
   - `Sprint` - seskupí podle sprintů (customfield_10000)
4. Klikni na **Load Data**
5. Prohlédni si grafy:
   - **Graf 1**: Procentuální rozložení kategorií
   - **Graf 2**: Absolutní HLE hodnoty

### Kategorie tasků

Aplikace třídí tasky do 4 kategorií (v tomto pořadí priority):

1. **Excluded** 🚫 - obsahuje label `RatioExcluded` nebo `Bughunting`
2. **Maintenance** 🔧 - obsahuje label `Maintenance` nebo `DevOps`
3. **Bug** 🐛 - typ issue je `Bug`
4. **Product** ✨ - všechny ostatní (výchozí)

## Struktura projektu

```
jirafly-web/
├── src/
│   ├── server.js           # Express server
│   ├── jira-client.js      # Jira API integrace
│   ├── data-processor.js   # Kategorizace a agregace
│   └── html-template.js    # HTML frontend s Chart.js
├── package.json            # NPM dependencies
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore           # Docker build exclusions
├── .env                    # ⚠️ CREDENTIALS - NIKDY NECOMMITOVAT!
├── .gitignore              # Git exclusions
└── README.md               # Dokumentace
```

## 🔒 Bezpečnost

**KRITICKÉ**: Přístupové údaje (JIRA_EMAIL a JIRA_API_TOKEN) jsou uloženy pouze na serveru v souboru `.env`.

- ✅ `.env` je v `.gitignore` - nebude commitnutý do gitu
- ✅ Frontend volá pouze `/api/data` endpoint, nikdy ne přímo Jira
- ✅ Credentials jsou používány pouze v backendu
- ✅ Error messages neodhazují citlivé informace

**Před každým commitem zkontroluj**:
```bash
# Ověř, že .env není v gitu
git status

# .env by NEMĚL být v seznamu změn!
```

## API Endpoints

### `GET /`
Vrátí HTML stránku s UI

### `GET /api/data?filter_id=X&group_by=Y`
Stáhne a zpracuje data z Jiry

**Parametry**:
- `filter_id` (number, výchozí: 18297) - ID Jira filtru
- `group_by` (string, výchozí: "fix_version") - možnosti: "fix_version" nebo "sprint"

**Response**:
```json
{
  "groups": ["6.10", "6.11", "6.12"],
  "categories": ["Excluded", "Maintenance", "Bug", "Product"],
  "countsByGroup": {
    "6.10": { "Excluded": 2, "Maintenance": 5, "Bug": 8, "Product": 25 }
  },
  "hleByGroup": {
    "6.10": { "Excluded": 0.5, "Maintenance": 4.0, "Bug": 12.0, "Product": 48.0 }
  },
  "totalIssues": 150
}
```

### `GET /health`
Health check endpoint

## Troubleshooting

### "Missing required environment variables"
- Zkontroluj, že `.env` soubor existuje
- Ověř, že obsahuje `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`

### "Jira API error: 401"
- Neplatný API token nebo email
- Vygeneruj nový token v Jira nastavení

### "No response from Jira API"
- Zkontroluj internetové připojení
- Ověř, že JIRA_URL je správná

### "Filter ID not found"
- Zkontroluj, že filter s daným ID existuje
- Ověř, že máš přístupová práva k filtru

## Technologie

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Chart.js 4.x
- **Jira API**: REST API v3 (Basic Auth)

## License

ISC