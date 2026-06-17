# PRD — TagTales Gallery

## Visione

TagTales Gallery è la piattaforma online dedicata alla cultura graffiti: connette **writers** (artisti) con **collezionisti** attraverso minimostre digitali, magazine e uno shop integrato. La vetrina pubblica e gli strumenti per artisti/admin hanno **pari dignità**: il sito deve essere bello da esplorare e solido da gestire.

**Promessa al collezionista:** scoprire storie autentiche di writer, esplorare mostre e magazine, acquistare opere e stampe con checkout affidabile.

**Promessa al writer:** portfolio, contratti, vendite e comunicazione con la galleria in un unico posto.

**Promessa all'admin:** curatela mostre, approvazione opere, vendite Ecwid, newsletter, SEO.

## Utenti

| Persona | Priorità | Bisogno principale |
|---------|----------|-------------------|
| **Collezionista** | Primaria | Scoprire, fidarsi, acquistare |
| Writer | Secondaria (lato supply) | Esporsi, vendere, firmare contratti |
| Admin (Claudio) | Operativa | Curare, approvare, monitorare vendite |

## Obiettivi (3 mesi)

1. Mantenere e consolidare ciò che è **già live**: mostre, writers, magazine, shop Ecwid, dashboard admin/writer.
2. Ottimizzare il percorso collezionista: **mostre/writers → magazine → acquisto Ecwid**.
3. Misurare successo in equilibrio: **vendite**, **engagement contenuti**, **community writers**.

## Fuori scope (esplicito)

- Generazione di immagini o arte con AI
- Social network tra writers (feed, follow, like)
- Aste online
- App nativa iOS/Android (oltre PWA esistente)
- Multi-tenant (altre gallerie oltre TagTales)

## Lingua e mercato

- **Primaria:** italiano (SEO e prima impressione)
- **Secondaria:** inglese (EN via LanguagePrompt e contenuti tradotti)
- Identità artistica: i writer sono **writers**, non "artisti" generici

## Vincoli tecnici noti

- Stack: React + Vite + Express (`dist/server.js`), Firebase (Auth, Firestore, Storage)
- Firestore DB non-default: `ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168`
- E-commerce: Ecwid (checkout esterno / integrato)
- Email: Resend (`tagtales@brignole.ch` / dominio `brignole.ch`)
- Deploy produzione: Hostinger, entry `dist/server.js`

## Riferimenti

- Task operativi: [`ROADMAP.md`](ROADMAP.md)
- Specifica funzionale: [`SPEC.md`](SPEC.md)
- Regole agente/design: [`AGENTS.md`](AGENTS.md)
