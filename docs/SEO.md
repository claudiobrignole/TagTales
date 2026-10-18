# SEO TagTales — guide operativa

Obiettivo: ogni pagina pubblica (esistente o nuova) resta indicizzabile, con
gerarchia heading corretta, meta IT/EN e link interni localizzati.

## Checklist nuova pagina pubblica

1. **Route** in `App.tsx` (IT + `/en/...` se serve).
2. **Un solo H1** semantico (titolo pagina). Sezioni = H2, card/sottosezioni = H3.
3. **`<SEO />`** da `src/components/SEO.tsx`:
   - Listing/home: `pageId="home|writers|exhibitions|magazine"` (legge `seoConfig` Firestore + Admin SEO Manager).
   - Home: `artGallery` per schema ArtGallery + sameAs (Instagram, YouTube AELLE, aelle.hiphop).
   - Detail: `title`, `description`, `image`, eventuali `keywords` / `jsonLd`.
   - Pagine private/404: `noIndex`.
4. **Link interni** con `localizedPath` / `langPrefix` (`src/utils/paths.ts`) — mai hardcodare solo path IT in vista EN. Writers: slug, non solo id.
5. **Sitemap**: se la route è statica, aggiungerla in `server.ts` → `/sitemap.xml`. Le collection `mostre` / `scrittori` / `articoli` / `pagine` published sono già dinamiche (`lastmod` da Firestore se presente).
6. **SSR lite**: in produzione `server.ts` inietta title/description/keywords/og/canonical/hreflang da `seoConfig` **e** da entity Firestore (`bannerHero` / `fotoProfilo`) nei placeholder di `index.html`.
7. **HTTP 404**: path sconosciuti e slug non published → status **404** (non 200).

## Canonici e redirect

| Regola | Dettaglio |
|--------|-----------|
| Origin | Sempre `https://tagtalesgallery.com` (no www in canonical) |
| Trailing slash | Nessuno; Express fa 301 da `/path/` → `/path` |
| Artists | `/artists` e `/en/artists` → 301 su `/writers` |
| Home titles | IT: `Tag Tales Gallery - Galleria di graffiti internazionale` · EN: `… International Graffiti Gallery` |
| OG default | `/og-default.jpg` (1200×630) |

## Domini e file chiave

| Cosa | Dove |
|------|------|
| Helmet client | `src/components/SEO.tsx` (`CANONICAL_ORIGIN`) |
| Config admin | `src/pages/admin/SEOManager.tsx` → Firestore `seoConfig` |
| Hook config | `src/hooks/useSeoConfig.ts` |
| Path IT/EN | `src/utils/paths.ts` |
| Sitemap + robots + SSR + 404 | `server.ts` |
| Placeholder HTML | `index.html` (`<!--META_*-->`) |

## Heading (AGENTS.md)

- Titoli Shamgod sempre **UPPERCASE**, `leading-[0.8]` / `leading-none`.
- Liste (Mostre/Writers/Magazine): H1 = nome sezione; card = H3.
- Home: H1 brand (anche `sr-only`); titoli carousel/sezione = H2.

## Hostinger (Git auto-deploy)

1. **Entry / Startup file:** `dist/server.js` (mai `server.js` in root).
2. **Build command:** `npm install && npm run build`.
3. **Start:** `npm start` oppure Passenger su `dist/server.js`.
4. **robots.txt statico orfano:** se `/robots.txt` non mostra header `X-TT-Robots: express` (o ancora punta a `tagtales.gallery`), in File Manager **elimina** ogni `robots.txt` fuori da `hbuilds/current/` (es. legacy `nodejs/dist/robots.txt`, `public_html/robots.txt`). LiteSpeed/Apache serve quel file **prima** di Node.
5. **www → non-www:** gestito in `server.ts` (middleware 301 + `trust proxy`). Assicurati che il DNS di `www` punti allo stesso app Node (altrimenti la richiesta non arriva a Express). Opzionale: anche un redirect a livello Hostinger come rete di sicurezza.
6. Verifica:
   - `curl -sI https://tagtalesgallery.com/sitemap.xml | grep X-TT-Sitemap` → `express`
   - `curl -sI https://tagtalesgallery.com/robots.txt | grep X-TT-Robots` → `express`
   - `curl -s https://tagtalesgallery.com/exhibitions/<slug> | grep og:image` → banner mostra
   - `curl -sI https://tagtalesgallery.com/pagina-inesistente` → `404`
   - Sitemap deve contenere `/assistenza` e `/su-di-noi`.

## auth.tagtalesgallery.com (Firebase Hosting)

Sottodominio Auth (dominio personalizzato Hosting, non il sito Hostinger).
Dalla console web **non** si caricano file/header: serve deploy CLI.

Config nel repo (cartella dedicata, **non** `public/` del sito marketing):

- [`hosting-auth/robots.txt`](../hosting-auth/robots.txt) → `Disallow: /`
- [`firebase.json`](../firebase.json) → `hosting.headers` con `X-Robots-Tag: noindex, nofollow` su `**`

Deploy (solo Hosting):

```bash
firebase deploy --only hosting
```

Note:

- **noindex via header** + Disallow: l’header serve a far uscire URL dall’indice; Disallow da solo non basta. Google deve poter leggere la risposta con noindex (ok su auth).
- `/__/auth/` resta gestito da Firebase Auth anche con `Disallow: /` (i crawler sono bloccati, il browser degli utenti no).
- Non usare `public/` del Vite app come `hosting.public`: quel `robots.txt` è `Allow: /` per tagtalesgallery.com.

Verifica post-deploy:

```bash
curl -sI https://auth.tagtalesgallery.com/robots.txt
curl -s https://auth.tagtalesgallery.com/robots.txt
# Header atteso: X-Robots-Tag: noindex, nofollow
# Body: Disallow: /
```

Nessun link pubblico dal sito principale verso `auth.*` (solo config Firebase).

## Checklist post-deploy (aggiornata 2026-10-18)

### Verificato in produzione (automatizzabile / già fatto)

- Home IT/EN: title e description approvati + inject su `/` (non più placeholder)
- Mostra `shaone-first-line` / writer `shaone`: title, description, og:image, canonical, hreflang
- HTTP 404 su path e slug inesistenti
- Redirect 301: trailing slash, `/artists`→`/writers`, `www`→non-www (pagine Express)
- Sitemap Express con hreflang + URL mostra
- `/og-default.jpg` raggiungibile

### Ancora manuale (Google / Hostinger / Firebase Auth)

1. **Google Search Console** (account Google del sito):
   - Conferma proprietà `https://tagtalesgallery.com` (senza www)
   - Sitemap: `https://tagtalesgallery.com/sitemap.xml` (se non già inviata)
   - Ispezione URL → **Richiedi indicizzazione** su: `/`, `/en`, `/exhibitions/shaone-first-line`, `/writers/shaone` (+ altre prioritarie)
   - Non spuntare ancora “problema risolto” sul report “Rilevata non indicizzata” finché non compaiono scansioni reali
2. **Rich Results Test** (opzionale ma utile): home + una mostra + un writer  
   https://search.google.com/test/rich-results
3. **www `/robots.txt`**: ancora file statico CDN (200). Opzionale: redirect dominio www→apex nel pannello Hostinger (copre anche i file statici)
4. **auth.tagtalesgallery.com**: config già in repo (`hosting-auth/` + `firebase.json`). Deploy Hosting ancora da fare a mano sul Mac:
   ```bash
   cd ~/Projects/TagTales && firebase login --reauth && firebase deploy --only hosting
   ```
   Poi verifica: `curl -sI https://auth.tagtalesgallery.com/robots.txt` → `X-Robots-Tag: noindex, nofollow`
5. **CMS**: dove le pagine pubbliche hanno poco testo, allunga bio/intro (≥ ~300 parole) in Admin
6. **Link UTM** su Instagram / YouTube (bio canale) — elenco sotto
7. **Admin SEO `seoConfig/home`**: allinea title/description ai valori sotto (il server ora forza title/desc home; conviene comunque allineare l’admin)

### Title / description home (canonici)

| | IT | EN |
|---|----|----|
| Title | `Tag Tales Gallery - Galleria di graffiti internazionale` | `Tag Tales Gallery - International Graffiti Gallery` |
| Description | `Tag Tales Gallery — galleria internazionale di street art e graffiti. Scopri mostre, writers e opere originali: esplora e visita le esposizioni.` | `Tag Tales Gallery — international street art and graffiti gallery. Discover exhibitions, writers and original works: explore and visit the shows.` |

## UTM social (da usare a mano)

| Canale | URL |
|--------|-----|
| Instagram bio | `https://tagtalesgallery.com/?utm_source=instagram&utm_medium=social&utm_campaign=profile_bio` |
| Instagram story | `https://tagtalesgallery.com/?utm_source=instagram&utm_medium=social&utm_campaign=story` |
| YouTube (canale AELLE) | `https://tagtalesgallery.com/?utm_source=youtube&utm_medium=social&utm_campaign=aelle_channel` |
| Instagram bio EN | `https://tagtalesgallery.com/en?utm_source=instagram&utm_medium=social&utm_campaign=profile_bio` |
| YouTube EN | `https://tagtalesgallery.com/en?utm_source=youtube&utm_medium=social&utm_campaign=aelle_channel` |
