# Jirafly Web

Webová aplikace pro analýzu distribuce Jira tasků týmů (Serenity, Falcon, Discovery, Kosmik) podle kategorií a sprintů.

## Popis

Jirafly automaticky stahuje tasky z projektu KNJ pro všechny týmy, roztřídí je do kategorií (Excluded, Maintenance, Bug, Product) a zobrazí jejich rozložení ve dvou interaktivních grafech + detailní tabulce tasků.

1. **Procentuální rozložení** - poměr kategorií v jednotlivých sprintech + průměr (podle HLE)
2. **Absolutní HLE hodnoty** - součty High Level Estimate hodnot podle kategorií + průměr
3. **Detailní tabulka** - seznam všech tasků s HLE, tracked time, statusem

## Hlavní funkce

- **Multi-team podpora** - Serenity, Falcon, Discovery, Kosmik
- **Team toggle** - přepínání mezi týmy (URL parametr pro sdílení)
- **Konfigurovatelný počet sprintů** - URL parametr `sprints`
- **Chytrá detekce sprintů** - automaticky detekuje aktuální sprint podle data konce a zobrazuje pouze aktuální + 1 budoucí sprint
- **Barevné kódování** - HLE nula (červená), překročený čas (oranžová/červená)
- **Interaktivní grafy** - Chart.js s tooltips a legendou
- **Hot reload** - okamžité zobrazení změn při vývoji

## Požadavky

- **Node.js** 18.0.0 nebo vyšší (pro lokální vývoj)
- **Docker** 20.10+ (doporučeno)
- **Jira API Token** - vygenerovat v Jira nastavení
- **Jira Email** - email propojený s Jira účtem

## Rychlý start

### S Dockerem (doporučeno)

1. **Nakonfiguruj `.env` soubor**:
   ```env
   JIRA_URL=https://mallpay.atlassian.net/
   JIRA_EMAIL=your.email@example.com
   JIRA_API_TOKEN=your_api_token_here
   PORT=3000
   AUTH_USERNAME=admin        # optional - basic auth
   AUTH_PASSWORD=secret       # optional - basic auth
   ```

2. **Spusť aplikaci**:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

3. **Otevři prohlížeč**: `http://localhost:3000`

### Bez Dockeru

1. **Nainstaluj závislosti**:
   ```bash
   npm install
   ```

2. **Nakonfiguruj `.env`** (viz výše)

3. **Spusť dev server**:
   ```bash
   npm run dev
   ```

4. **Otevři prohlížeč**: `http://localhost:3000`

## Použití

### Základní použití

1. Otevři `http://localhost:3000`
2. Data se načtou automaticky (všechny týmy, 6 sprintů)
3. Používej **tlačítko vpravo nahoře** pro přepínání mezi týmy

### URL parametry

```
http://localhost:3000/                           # Všechny týmy, 6 sprintů
http://localhost:3000/?team=serenity             # Pouze Serenity
http://localhost:3000/?sprints=10           # 10 sprintů
http://localhost:3000/?team=falcon&sprints=4
```

**Parametry**:
- `team` - filtr týmu (serenity, falcon, discovery, kosmik)
- `sprints` - počet sprintů (default: 6)

## Kategorie tasků

Aplikace třídí tasky do 4 kategorií (v pořadí priority):

1. **Excluded** (magenta) - obsahuje label `RatioExcluded` nebo `Bughunting`
2. **Maintenance** (modrá) - obsahuje label `Maintenance`
3. **Bug** (červená) - typ issue je `Bug`
4. **Product** (zelená) - všechny ostatní (výchozí)

**První shoda vyhrává!** Pokud má task label Maintenance a zároveň je typu Bug, je zařazen jako Maintenance.

**Poznámka**: Excluded tasky se nezapočítávají do procentuálního grafu (100% = Maintenance + Bug + Product).

## Tabulka tasků

Tabulka zobrazuje:
- **Sprint** - číslo sprintu (seskupené, oddělené šedou čárou)
- **Assignee** - přiřazená osoba (seskupené v rámci sprintu)
- **Task** - typ badge, klíč a název (zkráceno na 80 znaků)
- **HLE** - High Level Estimate (červená 0 = chybí odhad)
- **Tracked** - zalogovaný čas (oranžová >2x HLE, červená >3x HLE)
- **Fix Version** - verze (červená pokud nesedí se sprintem)
- **Status** - stav tasku (zelená Done/Merged, žlutá In Review)

**Typ badge barvy**:
- Bug - červený badge
- Analysis - tmavě šedý badge
- Ostatní - světle šedý badge

## Docker

```bash
# První spuštění
docker-compose build --no-cache
docker-compose up

# Další spuštění
docker-compose up

# Zastavení
docker-compose down

# Logy
docker-compose logs -f
```

## API Endpoints

### `GET /`
Vrátí HTML stránku s UI

### `GET /api/data`
Stáhne a zpracuje tasky všech týmů

**Parametry**:
- `sprints` (number, optional) - počet sprintů (default: 6)

### `GET /health`
Health check endpoint

## Bezpečnost

- `.env` je v `.gitignore` - nebude commitnutý
- Frontend volá jen `/api/data` endpoint
- Server má Basic Auth pro Jira API
- Žádné credentials v error messages

## Struktura projektu

```
jirafly-web/
├── src/
│   ├── server.js           # Express server + API endpoints
│   ├── jira-client.js      # Jira API, detekce sprintů, dynamická paginace
│   ├── data-processor.js   # Kategorizace a agregace
│   ├── html-template.js    # Frontend s Chart.js + tabulka
│   └── config.js           # Konfigurace (field IDs, barvy, týmy)
├── tests/                  # Testy
├── Dockerfile              # Docker image
├── docker-compose.yml      # Docker Compose
├── .env                    # CREDENTIALS - GITIGNORED!
├── CLAUDE.md               # Technická dokumentace
└── README.md
```

## Technologie

- **Backend**: Node.js 20, Express.js
- **Frontend**: Vanilla JavaScript, Chart.js 4.x
- **Jira API**: REST API v3 (Basic Auth)
- **Docker**: Alpine Linux

## License

ISC
