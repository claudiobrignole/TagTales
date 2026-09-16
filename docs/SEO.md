# SEO TagTales — guide operativa

Obiettivo: ogni pagina pubblica (esistente o nuova) resta indicizzabile, con
gerarchia heading corretta, meta IT/EN e link interni localizzati.

## Checklist nuova pagina pubblica

1. **Route** in `App.tsx` (IT + `/en/...` se serve).
2. **Un solo H1** semantico (titolo pagina). Sezioni = H2, card/sottosezioni = H3.
3. **`<SEO />`** da `src/components/SEO.tsx`:
   - Listing/home: `pageId="home|writers|exhibitions|magazine"` (legge `seoConfig` Firestore + Admin SEO Manager).
   - Detail: `title`, `description`, `image`, eventuali `keywords` / `jsonLd`.
   - Pagine private/404: `noIndex`.
4. **Link interni** con `localizedPath` / `langPrefix` (`src/utils/paths.ts`) — mai hardcodare solo path IT in vista EN.
5. **Sitemap**: se la route è statica, aggiungerla in `server.ts` → `/sitemap.xml`. Le collection `mostre` / `scrittori` / `articoli` / `pagine` published sono già dinamiche.
6. **SSR**: in produzione `server.ts` inietta title/description/keywords/og da `seoConfig` nei placeholder di `index.html` (crawler senza JS).

## Domini e file chiave

| Cosa | Dove |
|------|------|
| Helmet client | `src/components/SEO.tsx` |
| Config admin | `src/pages/admin/SEOManager.tsx` → Firestore `seoConfig` |
| Hook config | `src/hooks/useSeoConfig.ts` |
| Path IT/EN | `src/utils/paths.ts` |
| Sitemap + robots + SSR | `server.ts` |
| Placeholder HTML | `index.html` (`<!--META_*-->`) |

## Heading (AGENTS.md)

- Titoli Shamgod sempre **UPPERCASE**, `leading-[0.8]` / `leading-none`.
- Liste (Mostre/Writers/Magazine): H1 = nome sezione; card = H3.
- Home: H1 brand (anche `sr-only`); titoli carousel/sezione = H2.

## Dopo il deploy

- Verificare `https://tagtalesgallery.com/sitemap.xml` e `robots.txt`.
- Search Console: invio sitemap + URL inspection su home e una detail.
- Controllare che Admin → SEO Manager valori si vedano nel view-source (SSR).
