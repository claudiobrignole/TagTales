# TagTales Project Roadmap & Action Log


## 🎯 Obiettivi Principali
- **Dashboard Artisti**: Gestione profilo, portafoglio, caricamento opere e onboarding (Completo).
- **Dashboard Admin**: Approvazione opere, statistiche generali, gestione vendite ed erogazione contratti (Iniziato).
- **Integrazione Ecwid**: Sincronizzazione prodotti e ordini, calcolo royalties (Iniziato/Prototipato).
- **Frontend Pubblico (Nuovo Focus)**: Creazione di un sito vetrina completo (Artisti, Mostre, Catalogo) con UI/UX dedicata, agganciato a Ecwid per il checkout.


## 🔧 Logica Attributi Ecwid

Ogni prodotto TagTales su Ecwid può avere i seguenti attributi personalizzati (tutti con `show: NOTSHOW`):

| Attributo      | Obbligatorio | Esempio              | Note                                              |
|----------------|--------------|----------------------|---------------------------------------------------|
| `product_type` | Sì           | `tshirt`, `felpa`, `poster_a2`, `poster_a1`, `tela_12x18`, `tela_16x24`, `tela_20x30`, `tela_40x60`, `stampa_limitata` | Determina la fee dalla FEE_TABLE |
| `artist_id`    | No           | UID Firebase artista | Se assente: nessuna royalty calcolata (prodotto interno) |
| `promo_active` | No           | `true` / `false`     | Default false se assente. Usa la colonna promo della FEE_TABLE |
| `fee_override` | No           | `0`, `120`, `200`    | Se presente, sovrascrive qualsiasi calcolo FEE_TABLE |

### Comportamento webhook (ecwidWebhook.ts)
- Evento accettato: `order.created` (unico evento disponibile in Ecwid)
- Condizione di processamento: `paymentStatus === "PAID"`
- Se `product_type` mancante: item skippato con warning
- Se `artist_id` mancante: item skippato silenziosamente (prodotto interno, nessuna royalty)
- Se `fee_override` presente: usa quel valore fisso ignorando FEE_TABLE e promo_active
- Per `stampa_limitata` senza fee_override: fee = prezzo_vendita - 90.00
- `feeAmount` è sempre >= 0 (Math.max applicato)

### Procedura aggiunta attributi a un nuovo prodotto (via pannello Ecwid)

Usare ogni volta che si crea un nuovo prodotto TagTales su Ecwid.

**Step 1** — Creare il prodotto normalmente dal pannello: Catalog → Products → Add New Product. Inserire nome, foto, prezzo, varianti. Salvare.

**Step 2** — Aprire la scheda **Attributes** del prodotto appena creato.

**Step 3** — Compilare i campi (ignorare UPC, Brand e i campi `[English]`):

- `artist_id` → UID Firebase del writer (Firebase Console → Authentication → cerca per email → copia l'UID). Se prodotto interno, lasciare vuoto.
- `product_type` → uno di questi valori esatti: `tshirt`, `felpa`, `poster_a2`, `poster_a1`, `tela_12x18`, `tela_16x24`, `tela_20x30`, `tela_40x60`, `stampa_limitata`
- `promo_active` → `true` se in promozione, `false` o vuoto altrimenti
- `fee_override` → lasciare vuoto per fee standard. Scrivere `0` per prodotti interni senza royalty. Scrivere un numero (es. `120`) per fee fissa personalizzata.

**Step 4** — Salvare con il pulsante Save.

**Prodotti interni** (es. t-shirt TagTales logo): `artist_id` vuoto, `product_type` compilato, `fee_override` a `0`.

**Prodotti di un writer**: `artist_id` con UID Firebase, `product_type` compilato, `promo_active` e `fee_override` solo se necessario.


## 📝 Registro delle Azioni (Changelog)


### ✅ Completato finora
- Configurazione sistema di autenticazione e database con Firebase.
- Creazione della UI principale (Dashboard) e menu laterale.
- Sistema multilingua (IT, EN, ES, FR, DE).
- **Refactoring Culturale**: Sostituito il termine "Artist" con "Writer" in tutta l'applicazione (UI e codice) per coerenza con la cultura dei graffiti.
- **Localizzazione Completa**: Tradotto integralmente tutto il frontend pubblico, la dashboard, i componenti di navigazione (Header/Footer), i form di ricerca e le pagine di dettaglio per IT ed EN, con predisposizione per altre lingue.
- **Demo Content Reale**: Popolamento del database con leggende reali (Shaone, Phase 2, Futura 2000, Mode 2) e minimostre strutturate.
- Dashboard Artista (ora Writer Dashboard):
  - Sistema di onboarding strutturato (Profilo, Banca, Contratti, Opere).
  - Pagine: Profilo, Upload Opere, Le Mie Opere, Vendite, Contratti.
- Dashboard Admin:
  - Pagine: Opere da Approvare, Tutti gli Utenti/Artisti.
  - Generazione prodotti su Ecwid tramite API quando un'opera viene approvata.
  - Sincronizzazione webhook degli ordini Ecwid per distribuire i pagamenti.
- Cloud Functions Firebase deployate e funzionanti (`ecwidWebhook`, `markArtistPaid`, `initAdminClaim`).
- Funzione `ecwidWebhook` pubblica e raggiungibile su Cloud Run (`https://ecwidwebhook-6irjn534la-uc.a.run.app`).
- Logica calcolo fee artisti implementata (listino completo: t-shirt, felpa, poster, tele, stampe limitate).
- Policy organizzativa Google Cloud risolta (`iam.allowedPolicyMemberDomains`).
- Ottimizzazione Meta-Tag SEO (Title, Description, OpenGraph su tutte le pagine pubbliche).
- Sitemap automatica (`/sitemap.xml`) e file `robots.txt` integrati nel backend Express.
- Analisi incoerenze in naming e componenti (Artist → Writer completato).
- **Internazionalizzazione URL (11 maggio 2026)**:
  - Invertito l'ordine di `<BrowserRouter>` e `<I18nProvider>` in `App.tsx` per abilitare `useNavigate` e `useLocation` dentro il context.
  - Creato `src/components/EnRouteWrapper.tsx`: forza la lingua EN su tutte le route `/en/*` tramite `setLanguage("EN", true)` senza scatenare loop di redirect.
  - Aggiunta firma `skipRedirect?: boolean` a `setLanguage` in `I18nContext.tsx`.
  - Duplicate tutte le route pubbliche con prefisso `/en/*` in `App.tsx` (home, writers, exhibitions, magazine con slug dinamici).
  - Logica redirect automatico IT↔EN in `setLanguage`: naviga su `/en/[path]` scegliendo EN, rimuove il prefisso scegliendo IT. Guard attivo per escludere le route `/app/*` dal redirect.
  - `LanguagePrompt` montato dentro `I18nProvider` in `App.tsx` (era importato ma non renderizzato).
  - **SEO hreflang centralizzato** in `src/components/SEO.tsx`: genera automaticamente `<link rel="alternate" hrefLang="it">`, `<link rel="alternate" hrefLang="en">` e `<link rel="alternate" hrefLang="x-default">` per tutte le pagine pubbliche. Canonical URL pulito da trailing slash.


### 🚧 In Corso (Fase attuale)
- Approccio Ibrido Frontend Pubblico + API Ecwid: Analisi e progettazione architetturale.
- Definizione della UI/UX per le pagine pubbliche.
- Completamento registrazione webhook Ecwid (risposta supporto in attesa — `client_id: custom-app-127192517-1`, evento `order.paid`).


## 🚀 Piano Go-Live — Maggio 2026

Task ordinati per blocco logico. Ogni blocco deve essere completato prima di aprire la piattaforma ad artisti e clienti.


### Blocco 1 — Integrazione Ecwid (sblocca tutto il resto)

- [x] **1.1** Completare la registrazione del webhook Ecwid e verificare la risposta del supporto.
- [ ] **1.2** Verificare i nomi esatti degli attributi degli item (`artist_id`, `product_type`, `promo_active`) su un ordine reale via API Ecwid.
- [ ] **1.3** Test end-to-end con un ordine reale (importo minimo): verificare la scrittura corretta su Firestore nelle collection `royalties` e `users/{artistId}`.
- [x] **1.4** Configurare ogni prodotto Ecwid dello store con gli attributi personalizzati. Attributi aggiunti al product type 0: `artist_id`, `product_type`, `promo_active`, `fee_override`. I 4 prodotti TagTales (t-shirt interne, IDs: 801191401, 801191674, 801191735, 801196475) configurati con `product_type: tshirt` senza artist_id (prodotti interni, nessuna royalty).


### Blocco 2 — Frontend e Autenticazione

- [ ] **2.1** Verificare i flussi di registrazione e login artisti dall'interfaccia utente con Firebase Auth e custom claims.
- [ ] **2.2** Testare la Dashboard Writer in produzione: dati vendita per prodotto, revenue, commissioni, accesso contratti, upload fatture, richiesta pagamento.
- [ ] **2.3** Testare la Dashboard Admin in produzione: visualizzazione `pendingBalance` per artista, funzione `markArtistPaid` operativa.
- [x] **2.4** Pulizia repository: spostare o rimuovere gli script di sviluppo dalla root (`translate_locales_v*.cjs`, `update_grids.cjs`, `update_layout.cjs`, `apply_updates.cjs`, `replace.cjs`, `populateData.ts`, ecc.).
- [x] **2.5** Internazionalizzazione URL: route `/en/*` duplicate, `EnRouteWrapper`, redirect automatico IT↔EN, hreflang in `SEO.tsx` (completato 11 maggio 2026).
- [ ] **2.6** Aggiungere le route `/en/assistenza` e `/en/su-di-noi` seguendo lo stesso pattern delle route `/en/*` già implementate.
- [ ] **2.7** Testare il comportamento del `LanguagePrompt` dopo il login: verificare che il redirect verso `/en/` scatti correttamente quando l'utente accetta la lingua EN dal prompt.
- [ ] **2.8** Aggiungere al footer (o header pubblico) un selettore lingua visibile anche nelle pagine pubbliche, che sfrutti `setLanguage` con redirect URL automatico.


### Blocco 3 — Contenuto e Onboarding Artisti

- [ ] **3.1** Caricare la prima mostra reale su Firestore tramite `populateData.ts` o pannello admin.
- [ ] **3.2** Testare il flusso di upload contratti firmati in Firebase Storage e la loro visualizzazione nella Dashboard Writer.
- [ ] **3.3** Rendere accessibile la Guida Introduttiva per Artisti dalla piattaforma (pagina pubblica o download dall'area writer).


### Blocco 4 — Sicurezza e Infrastruttura

- [x] **4.1** Revisione completa delle `firestore.rules` prima del go-live: `royalties` write-only per Cloud Functions, read-only per l'artista proprietario; nessun dato di altri artisti leggibile.
- [x] **4.2** Verificare che `keys.txt` in root non contenga chiavi o token esposti; se sì, rimuovere dalla storia git con `git filter-repo` e ruotare le chiavi.
- [ ] **4.3** Attivare Google Cloud Monitoring per le metriche delle Cloud Functions e di Cloud Run.
- [ ] **4.4** Configurare almeno 1 istanza minima attiva su Cloud Run per ridurre i cold start.


### Blocco 5 — Operativo Post-Lancio

- [ ] **5.1** Documentare internamente il processo di pagamento agli artisti (soglia €500, cadenza 30 giorni, verifica `pendingBalance`, richiesta fattura, esecuzione bonifico).
- [ ] **5.2** Aggiornare Node.js da 20 a 22 nelle Cloud Functions (scadenza decommissioning: 30 ottobre 2026).
- [ ] **5.3** Aggiornare `firebase-functions` SDK da 4.9.0 a >=5.1.0 (in branch separata, con attenzione ai breaking changes).
- [ ] **5.4** Se in futuro si aggiunge una terza lingua, replicare il pattern di `EnRouteWrapper` con un nuovo prefisso URL (es. `/fr/*`) e aggiornare `SEO.tsx` per includere il nuovo hreflang.


## 🔍 Blocco 6 — SEO, Analytics & Advertising

Obiettivo: dotare TagTales di un sistema SEO completo e gestibile dall'admin, con tracciamento analytics, integrazione pixel Meta e predisposizione per campagne Google Ads e Meta Ads.

***

### Fase 6.1 — Google Analytics 4 (GA4) base

- [ ] **6.1.1** Aggiungere snippet `gtag.js` (GA4) nel template HTML principale (`index.html`).
- [ ] **6.1.2** Integrare `react-ga4` nel progetto e agganciarlo al router: ogni cambio di route deve triggerare un evento `pageview`.
- [ ] **6.1.3** Definire e tracciare eventi personalizzati: `view_artist`, `view_artwork`, `ecwid_product_click`, `checkout_initiated`.
- [ ] **6.1.4** Verificare l'attivazione su Google Analytics e collegare la property a Google Search Console.

**File coinvolti:** `index.html`, `src/App.tsx`, nuovo `src/utils/analytics.ts`

***

### Fase 6.2 — Google Search Console + Sitemap bilingue

- [ ] **6.2.1** Verificare il dominio `tagtalesgallery.com` su Google Search Console (metodo DNS o file HTML).
- [ ] **6.2.2** Controllare che la sitemap dinamica (`/sitemap.xml`) generata da Express includa tutte le route `/en/*` create con l'internazionalizzazione (completata l'11 maggio 2026).
- [ ] **6.2.3** Inviare la sitemap a Google Search Console e monitorare l'indicizzazione.

**File coinvolti:** `server.ts` (funzione sitemap), verifica manuale su Search Console.

***

### Fase 6.3 — Meta Pixel (base + Conversions API)

- [ ] **6.3.1** Aggiungere lo snippet Meta Pixel nel template HTML principale con il Pixel ID corretto.
- [ ] **6.3.2** Tracciare gli eventi standard client-side: `ViewContent` su pagine artista/opera, `InitiateCheckout` su click Ecwid.
- [ ] **6.3.3** Implementare la **Meta Conversions API** server-side nella Cloud Function `ecwidWebhook` esistente: inviare l'evento `Purchase` a Meta quando un ordine Ecwid risulta `PAID`, usando l'Access Token del Pixel. Questo garantisce il tracciamento anche con adblocker attivi.

**File coinvolti:** `index.html`, `src/App.tsx`, `functions/src/ecwidWebhook.ts`

***

### Fase 6.4 — SEO Manager nel pannello Admin

Questa è la funzionalità principale: un'interfaccia nel pannello Admin per gestire i meta-tag SEO di ogni pagina statica pubblica (Home, Magazine, Writers, Mostre).

**Struttura dati Firestore — nuova collection `seoConfig/{pageId}`:**
```
{
  titleIT: string,
  titleEN: string,
  descriptionIT: string,
  descriptionEN: string,
  keywordsIT: string[],
  keywordsEN: string[],
  ogImageUrl: string,
  ogImageAlt: string,
  updatedAt: timestamp
}
```

**Pagine gestite:** `home`, `magazine`, `writers`, `exhibitions`

- [ ] **6.4.1** Creare la collection Firestore `seoConfig` con i 4 documenti iniziali.
- [ ] **6.4.2** Creare la pagina `SEOManager` nel pannello Admin con form per ogni pagina: titolo IT/EN, description IT/EN, upload immagine OG (→ Firebase Storage `og-images/{pageId}`), bottone "Suggerisci keywords con Gemini".
- [ ] **6.4.3** Implementare la Cloud Function `generateSEOKeywords` (callable): riceve il contenuto testuale della pagina e la lingua, chiama Gemini API, restituisce un array di 8-10 keywords consigliate.
- [ ] **6.4.4** Aggiornare il middleware Express (`server.ts`) per leggere `seoConfig/{pageId}` da Firestore e iniettare i meta-tag corretti nell'HTML prima di servire ogni pagina pubblica, in modo che i crawler (Google, Facebook, WhatsApp) ricevano i tag aggiornati anche se la SPA non è ancora idratata.

**File coinvolti:** `server.ts`, `src/pages/admin/SEOManager.tsx` (nuovo), `functions/src/generateSEOKeywords.ts` (nuovo), `firestore.rules` (aggiornare permessi).

***

### Fase 6.5 — Widget Analytics nel pannello Admin

- [ ] **6.5.1** Integrare la **Google Analytics Data API v1** tramite Service Account per mostrare nel pannello Admin i dati principali: sessioni, utenti attivi, pageview per pagina, fonti di traffico (ultimi 30 giorni).
- [ ] **6.5.2** Aggiungere un widget "Traffico per pagina" nella Dashboard Admin che mostri le 10 pagine più visitate.
- [ ] **6.5.3** Valutare l'integrazione dell'**Insights API Meta** per visualizzare le performance del Pixel (impression, reach, eventi tracciati) nel pannello Admin.

**Note:** Richiede un Service Account Google Cloud con permesso `roles/analyticsdata.viewer` sulla property GA4. Le credenziali vanno salvate come environment variable su Hostinger, mai nel repository.

**File coinvolti:** `server.ts` (nuovo endpoint `/api/admin/analytics`), `src/pages/admin/AnalyticsDashboard.tsx` (nuovo).

***

### Fase 6.6 — Collegamento Google Ads e Meta Ads

- [ ] **6.6.1** Collegare la property GA4 all'account Google Ads tramite la console Google Analytics (operazione manuale, nessun codice richiesto).
- [ ] **6.6.2** Importare le conversioni GA4 in Google Ads per il retargeting e l'ottimizzazione delle campagne.
- [ ] **6.6.3** Nel pannello Admin aggiungere link diretti a Google Ads Dashboard e Meta Business Manager per accesso rapido alle campagne senza implementazione API completa.
- [ ] **6.6.4** Con Meta Pixel attivo (Fase 6.3), creare Audience Personalizzate su Meta: visitatori pagine artisti, visitatori pagine opere, chi ha avviato checkout ma non acquistato.

**Note:** Il collegamento Google Ads non richiede codice aggiuntivo se GA4 è configurato correttamente. Meta Ads usa automaticamente i dati del Pixel attivato nella Fase 6.3.

***

### Ordine di esecuzione consigliato

| Step | Fase | Complessità | Note |
|------|------|-------------|------|
| 1 | 6.1 GA4 base | Bassa | Un solo prompt |
| 2 | 6.2 Search Console | Bassa | Manuale + verifica sitemap |
| 3 | 6.3 Meta Pixel base | Bassa | Un solo prompt |
| 4 | 6.4 SEO Manager Admin | Alta | 3-4 prompt separati |
| 5 | 6.3.3 Conversions API | Media | Estende webhook esistente |
| 6 | 6.5 Widget Analytics | Alta | Richiede Service Account |
| 7 | 6.6 Ads collegamento | Media | In parte manuale |

