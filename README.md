# TagTales Gallery

Piattaforma online per la cultura graffiti: mostre, writers, magazine e shop Ecwid.

- **Prodotto:** [`PRD.md`](PRD.md) | **Specifica:** [`SPEC.md`](SPEC.md) | **Roadmap:** [`ROADMAP.md`](ROADMAP.md)
- **Deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md)
- **Regole agente:** [`AGENTS.md`](AGENTS.md)

## Prerequisiti

- Node.js 20+
- Account Firebase (progetto `gen-lang-client-0591253558`)

## Setup locale

```bash
git clone https://github.com/claudiobrignole/TagTales.git
cd TagTales
npm install
cp .env.example .env   # compila le chiavi
```

### Variabili essenziali (`.env`)

Vedi [`.env.example`](.env.example) e [`docs/DEPLOY.md`](docs/DEPLOY.md) per l'elenco completo.

### Login admin in sviluppo

Google OAuth su localhost è fragile. Usa il bypass dev:

1. Scarica la service account JSON da Firebase Console → Impostazioni → Account di servizio
2. Salvala come `serviceAccountKey.json` nella root (gitignored)
3. `npm run dev` — verifica log: `Firebase Admin inizializzato`
4. Apri http://localhost:3000/login → **Dev: accedi come admin**

Alternativa: `FIREBASE_SERVICE_ACCOUNT_BASE64` in `.env` (come in produzione).

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Server dev su http://localhost:3000 |
| `npm run lint` | Typecheck TypeScript |
| `npm test` | Test automatici (Vitest) |
| `npm run build` | Build frontend + `dist/server.js` |
| `npm start` | Produzione: `node dist/server.js` |

## Verifica

```bash
npm run lint && npm test && npm run build
```

## Cursor

Struttura vibe coding in [`.cursor/`](.cursor/): rules, commands (`/commit-push`, `/verify-local`), agents.

## Produzione

Hostinger → entry `dist/server.js`. Env vars documentate in [`docs/DEPLOY.md`](docs/DEPLOY.md).
