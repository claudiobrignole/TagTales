# TagTales Project Roadmap & Action Log


## 🎯 Obiettivi Principali
- **Dashboard Artisti**: Gestione profilo, portafoglio, caricamento opere e onboarding (Completo).
- **Dashboard Admin**: Approvazione opere, statistiche generali, gestione vendite ed erogazione contratti (Iniziato).
- **Integrazione Ecwid**: Sincronizzazione prodotti e ordini, calcolo royalties (Iniziato/Prototipato).
- **Frontend Pubblico (Nuovo Focus)**: Creazione di un sito vetrina completo (Artisti, Mostre, Catalogo) con UI/UX dedicata, agganciato a Ecwid per il checkout.


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
- [ ] **2.4** Pulizia repository: spostare o rimuovere gli script di sviluppo dalla root (`translate_locales_v*.cjs`, `update_grids.cjs`, `update_layout.cjs`, `apply_updates.cjs`, `replace.cjs`, `populateData.ts`, ecc.).


### Blocco 3 — Contenuto e Onboarding Artisti

- [ ] **3.1** Caricare la prima mostra reale su Firestore tramite `populateData.ts` o pannello admin.
- [ ] **3.2** Testare il flusso di upload contratti firmati in Firebase Storage e la loro visualizzazione nella Dashboard Writer.
- [ ] **3.3** Rendere accessibile la Guida Introduttiva per Artisti dalla piattaforma (pagina pubblica o download dall'area writer).


### Blocco 4 — Sicurezza e Infrastruttura

- [ ] **4.1** Revisione completa delle `firestore.rules` prima del go-live: `royalties` write-only per Cloud Functions, read-only per l'artista proprietario; nessun dato di altri artisti leggibile.
- [ ] **4.2** Verificare che `keys.txt` in root non contenga chiavi o token esposti; se sì, rimuovere dalla storia git con `git filter-repo` e ruotare le chiavi.
- [ ] **4.3** Attivare Google Cloud Monitoring per le metriche delle Cloud Functions e di Cloud Run.
- [ ] **4.4** Configurare almeno 1 istanza minima attiva su Cloud Run per ridurre i cold start.


### Blocco 5 — Operativo Post-Lancio

- [ ] **5.1** Documentare internamente il processo di pagamento agli artisti (soglia €500, cadenza 30 giorni, verifica `pendingBalance`, richiesta fattura, esecuzione bonifico).
- [ ] **5.2** Aggiornare Node.js da 20 a 22 nelle Cloud Functions (scadenza decommissioning: 30 ottobre 2026).
- [ ] **5.3** Aggiornare `firebase-functions` SDK da 4.9.0 a >=5.1.0 (in branch separata, con attenzione ai breaking changes).
