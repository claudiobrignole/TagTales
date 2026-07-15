# Deploy — TagTales Gallery (Hostinger)

## Entry point

- **Build:** `npm run build`
- **Start:** `node dist/server.js`
- **Non cambiare** gli script in `package.json` (Regola 7 AGENTS.md)

## URL produzione

- Sito: https://tagtalesgallery.com
- Auth domain Firebase: `auth.tagtalesgallery.com`

## Variabili d'ambiente (Hostinger)

Configurate in produzione (valori reali **solo** nel pannello Hostinger, mai in git):

| Variabile | Uso |
|-----------|-----|
| `GEMINI_API_KEY` | Traduzioni AI, assistente |
| `GOOGLE_API_KEY` | API Google aggiuntive (Hostinger); in locale spesso separata da Gemini |
| `PAGESPEED_API_KEY` | PageSpeed Insights (fallback: GEMINI se AIzaSy) |
| `RESEND_API_KEY` | Invio email transazionali |
| `SMTP_FROM` | Mittente (es. `tagtales@brignole.ch`) |
| `SENDFOX_ACCESS_TOKEN_BASE64` | Newsletter SendFox (Base64 per Hostinger) |
| `SENDFOX_FROM_NAME` | Nome mittente campagne |
| `SENDFOX_FROM_EMAIL` | Email mittente campagne |
| `SENDFOX_DEFAULT_LIST_ID` | Lista default iscrizioni |
| `ECWID_STORE_ID` | ID store Ecwid |
| `ECWID_SECRET_TOKEN` | Token API Ecwid — **usato dal codice** in `server.ts` |
| `ECWID_CLIENT_SECRET` | Presente su Hostinger — deve coincidere con `ECWID_SECRET_TOKEN` se duplicato |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase Admin SDK (functions, server-side) |
| `META_PIXEL_ACCESS_TOKEN` | Meta Pixel / tracking ads |

## Locale vs produzione

| Aspetto | Locale | Produzione |
|---------|--------|------------|
| Env file | `.env` | Pannello Hostinger |
| Service account | `serviceAccountKey.json` OK | `FIREBASE_SERVICE_ACCOUNT_BASE64` |
| Login admin | Pulsante dev + custom token | Google OAuth / email |
| Porta | 3000 | 80/443 (reverse proxy) |

## Ecwid webhook

- **Stato:** configurato (Firebase Functions)
- File: `functions/src/ecwidWebhook.ts`
- Evento: `order.created` con `paymentStatus === PAID`
- Attributi prodotto e fee writers: procedura completa in [ECWID-WRITERS.md](./ECWID-WRITERS.md) (storico in ROADMAP.md)

## Firebase

- Project ID: `gen-lang-client-0591253558`
- Firestore database ID: `ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168`

### Regole Firestore (anteprima privata)

Dopo modifiche a `firestore.rules`, deploy:

```bash
firebase deploy --only firestore:rules
```

Il database Firestore non è quello default: è configurato in `firebase.json` con ID `ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168`. Il progetto Firebase è `gen-lang-client-0591253558` (`.firebaserc`).

## Checklist post-deploy

1. Homepage risponde 200
2. Login admin produzione
3. Email test (Resend)
4. `/api/ecwid/products` (autenticato server-side)
5. Sitemap: `https://tagtalesgallery.com/sitemap.xml`
