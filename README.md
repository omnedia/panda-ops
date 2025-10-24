# panda-ops

Ein Tool für automatisierte, AI-gestützte Code-Reviews über GitHub, Bitbucket und Azure DevOps. Läuft als Dockerisierter CLI-Schritt in CI/CD Pipelines.

## Aktueller Stand
- Adapter-Struktur (Platzhalter API Calls)
- Diff holen (Mock) und Heuristik-Regeln: TODO, console.log, debugger, große Anzahl hinzugefügter Zeilen
- Optionaler AI Pass via OpenAI (Model konfigurierbar)
- Kombinierte Ausgabe / JSON / Dry-Run / CI Exit Codes

## Installation
```cmd
npm install
npm run build
```

## CLI Nutzung
```cmd
node dist/main.js --provider github --repository demo/repo --pull-request-id 42 --token dummy --dry-run
```

Mit AI (wenn OPENAI_API_KEY gesetzt):
```cmd
set OPENAI_API_KEY=sk-... && node dist/main.js -p github -r demo/repo -i 42 -t dummy
```

JSON Ausgabe:
```cmd
node dist/main.js -p github -r demo/repo -i 42 -t dummy --output-json
```

Fehlercode wenn Kommentare vorhanden (z.B. zum Blockieren des Builds):
```cmd
node dist/main.js -p github -r demo/repo -i 42 -t dummy --fail-on-comments
```
Exit Codes:
- 0: Keine Fehler / Erfolg
- 1: Konfigurations-/Laufzeitfehler
- 2: Kommentare gefunden und `--fail-on-comments` aktiv

## Optionen
| Option | Beschreibung |
|--------|--------------|
| --provider | Provider (github|bitbucket|azure) |
| --repository | Repository Kennung (Pflicht) |
| --pull-request-id | PR ID (Pflicht) |
| --token | Auth Token (Pflicht) |
| --api-base | Override Basis-URL |
| --dry-run | Nur Ausgabe, kein Post |
| --output-json | JSON auf STDOUT |
| --fail-on-comments | Exit Code 2 falls Kommentare vorhanden |
| --openai-api-key | API Key (alternativ ENV OPENAI_API_KEY) |
| --openai-model | Modell (Standard gpt-4o-mini) |
| --openai-temperature | Temperatur (Default 0.2) |
| --openai-max-tokens | Max Tokens (Default 800) |
| --no-ai | AI deaktivieren |
| --max-comments | Begrenzung Anzahl Kommentare (Default 50) |

## Environment Variablen
| Variable | Beschreibung |
|----------|--------------|
| PROVIDER | Provider Name |
| REPOSITORY | Repository Kennung |
| PULL_REQUEST_ID | PR ID |
| TOKEN | Auth Token |
| API_BASE | Optionaler Override |
| DRY_RUN | "1" oder "true" für Dry-Run |
| OUTPUT_JSON | "1" oder "true" für JSON |
| FAIL_ON_COMMENTS | "1" oder "true" für Exit Code 2 |
| OPENAI_API_KEY | OpenAI Schlüssel |
| OPENAI_MODEL | Modellname |
| OPENAI_TEMPERATURE | Zahl (0-2) |
| OPENAI_MAX_TOKENS | Ganzzahl |
| NO_AI | "1" oder "true" deaktiviert AI |
| MAX_COMMENTS | Begrenzung Anzahl Kommentare |

## Docker
```cmd
docker build -t panda-ops .
docker run --rm ^
  -e PROVIDER=github ^
  -e REPOSITORY=demo/repo ^
  -e PULL_REQUEST_ID=42 ^
  -e TOKEN=dummy ^
  -e OPENAI_API_KEY=sk-... ^
  panda-ops --output-json
```

## Weiteres
Geplante Erweiterungen:
- Echte REST/GraphQL Calls (Rate Limits / Paging)
- Inline & Batch Kommentare
- Konfigurierbare Regel-Engine
- Caching großer Diffs
- Tests & Coverage

## Lizenz
MIT (geplant)
