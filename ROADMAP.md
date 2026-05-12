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

- [ ] **1.1** Completare la registrazione del webhook Ecwid e verificare la risposta del supporto.
- [ ] **1.2** Verificare i nomi esatti degli attributi degli item (`artist_id`, `product_type`, `promo_active`) su un ordine reale via API Ecwid.
- [ ] **1.3** Test end-to-end con un ordine reale (importo minimo): verificare la scrittura corretta su Firestore nelle collection `royalties` e `users/{artistId}`.
- [ ] **1.4** Configurare ogni prodotto Ecwid dello store con gli attributi personalizzati `artist_id` e `product_type`; impostare `promo_active: true` sui prodotti in promozione.


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
