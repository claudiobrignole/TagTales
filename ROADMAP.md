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

### 🚧 In Corso (Fase attuale)
- Approccio Ibrido Frontend Pubblico + API Ecwid: Analisi e progettazione architetturale.
- Definizione della UI/UX per le pagine pubbliche.

### ✅ Completato
- Analisi Incoerenze in Naming e Componenti (Artist -> Writer completato)
- Ottimizzazione Meta-Tag SEO e Configurazione (Title, Description, OpenGraph su tutte le pagine pubbliche, sia principali che secondarie)
- Sitemap automatica (/sitemap.xml) e file robots.txt integrati nel backend Express.
