# Design Guidelines & Project Rules

## Typography & Hierarchy

### Fonts
- **Titles/Headings**: Shamgod
  - **Always Uppercase**: Tutti i testi in font Shamgod devono essere in maiuscolo.
  - Always use `leading-[0.8]` or `leading-none` for Shamgod to ensure tight line spacing.
  - No letter spacing (`tracking-normal` or `letter-spacing: 0`).
- **Body & Small Text**: Karla 

### Structure & Layout
- **Public Layout**: Tutte le pagine pubbliche devono utilizzare il componente `PublicLayout` per garantire la presenza costante di **Header** e **Footer**.
- **SEO**: Utilizzare tag semantici (`<h1>`, `<h2>`, `<h3>`, `<p>`) rispettando la gerarchia visiva.

1. **Massive Section Titles / Post Titles / Artist Names (H1 or primary H2)**
   - Use `text-[10vw]` or `text-[80px] md:text-[150px] lg:text-[200px]` depending on fit, but remain as large as the original "MAGAZINE" title.
   - Example class: `font-['Shamgod'] text-[80px] md:text-[150px] lg:text-[200px] leading-[0.8]`
   - Specifically: "MINIMOSTRE" (must fit on one line), "WRITERS", "MAGAZINE" must all use this massive size and consistency.

2. **Harmonic Scale for other Headings**
   - **H2 (Secondary)**: `font-['Shamgod'] text-[60px] md:text-[100px] leading-[0.8]`
   - **H3 (Tertiary)**: `font-['Shamgod'] text-[50px] md:text-[75px] leading-[0.9]`
   - **H4 (Quaternary)**: `font-['Shamgod'] text-[30px] md:text-[40px] leading-[1]`

3. **Small Titles & Buttons**
   - Font: **Karla Bold**
   - Transformation: **Always Uppercase** (`uppercase`)
   - Example class (Buttons/Small Labels): `font-['Karla'] font-bold uppercase tracking-wider`

4. **Paragraphs (Body Text)**
   - Font: **Karla Normal** (or Medium for emphasis)
   - Example class: `font-['Karla'] text-lg md:text-xl font-normal leading-relaxed`

### Language & Internationalization
- **Primary Language**: Italian (`it`) is the primary language for SEO and indexing.
- **Language Selection**: Handled via `LanguagePrompt` which suggests to switch language cleanly via a pop-up rather than auto-switching strictly, ensuring the first load remains Italian if desired for crawlers.

### Responsive Rules
- **Slider Tablet Padding**: Use fixed 25px horizontal padding (`md:px-[25px]`) for centered content boxes on tablets.
- **Image Border Radius**: Always use standardized radius constants from `src/constants/theme.ts`:
  - `IMAGE_RADIUS.SM` for thumbnails/small items.
  - `IMAGE_RADIUS.MD` for grid cards/medium items.
  - `IMAGE_RADIUS.LG` for hero/large featured images.

## CRITICAL RULES: Rich Text, Typography & ReactQuill

Regola 1: Sanificazione Obbligatoria (Data Purify). Ogni volta che si renderizza contenuto HTML proveniente dal database/ReactQuill, è TASSATIVO passare il contenuto attraverso la funzione cleanHtml (da src/utils/cleanHtml.ts) prima di iniettarlo in dangerouslySetInnerHTML. Questo previene la rottura del layout eliminando Non-Breaking Spaces (&nbsp;, \u00A0) e Soft Hyphens.

Regola 2: Il 'Golden Wrapper' Tailwind. Il contenitore del testo prose DEVE utilizzare ESATTAMENTE questa base intoccabile: className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla']". Qualsiasi variazione sui margini (my-2, my-4) o sul wrap (whitespace-pre-wrap) è vietata.

Regola 3: Divieto Assoluto di Hack CSS. È SEVERAMENTE VIETATO tentare di alterare il word-break o la sillabazione tramite: tag <style> iniettati nei componenti, varianti arbitrarie complesse come [&_*]:[word-break:...], o override globali in index.css.

Regola 4: Contenitori Flessibili Sicuri. Qualsiasi contenitore genitore (Flexbox o Grid) che avvolge un articolo o una pagina di testo deve implementare min-w-0 per permettere ai figli di restringersi correttamente, evitando overflow orizzontali.

## Gestione della Roadmap (ROADMAP.md)

Quando l'utente chiede il passo successivo della roadmap, o cosa fare dopo, o qual è il task corrente:

1. Leggi il file `/ROADMAP.md` dalla root del progetto.
2. Analizza lo stato attuale: identifica quali task `[ ]` sono ancora aperti e quali `[x]` sono già completati.
3. Presenta un riepilogo sintetico: quanti task completati, quanti aperti, qual è il blocco corrente.
4. Suggerisci il prossimo task da affrontare rispettando l'ordine dei blocchi (Blocco 1 → Blocco 2 → Blocco 3 → Blocco 4 → Blocco 5). Non proporre task di un blocco successivo finché tutti i task del blocco corrente non sono completati o esplicitamente rimandati dall'utente.

Quando completi un task durante la sessione:
- Aggiorna immediatamente `/ROADMAP.md` cambiando `[ ]` in `[x]` per il task completato.
- Comunica all'utente quale task è stato marcato come fatto e qual è il prossimo.

Regole aggiuntive per la roadmap:
- Non marcare un task come completato se non è stato testato e verificato nella sessione corrente.
- Se un task è bloccato da una dipendenza esterna (es. risposta supporto Ecwid), segnalarlo esplicitamente e passare al task successivo disponibile nello stesso blocco o nel blocco successivo se possibile.
- Se l'utente chiede di lavorare su qualcosa che non è nella roadmap, completare l'azione e poi proporre di aggiungere il nuovo task alla roadmap con il blocco e il numero appropriati.

## Dashboard Padding

1. **Layout Base**: The `Layout.tsx` main wrapper provides the main dashboard spacing using `className="flex-1 p-[25px] md:p-[50px] w-full"`. 
2. **Admin Pages**: All sections and routes within the admin dashboard MUST use a `w-full` outer wrapper (e.g. `className="w-full space-y-8"`) WITHOUT ANY additional padding (no `p-4`, `p-8`) and WITHOUT constraining `max-w-[...]` or `mx-auto`. The spacing is fully controlled by the parent `Layout.tsx`. This utilizes the available space minus the predefined layout margin padding uniformly.

## Gestione Azioni Distruttive ed Eliminazione Utenti

Regola 5: Divieto assoluto di `window.confirm` e `window.alert`. Poiché l'app viene renderizzata all'interno di un iFrame (nel preview di AI Studio e contesti simili), i popup nativi del browser (`window.confirm`) vengono frequentemente bloccati o creano eccezioni non gestite che interrompono l'esecuzione. NON usare MAI `window.confirm`. Qualsiasi operazione distruttiva deve invocare una Modal React UI (es. custom pop-up con tailwind e state handling).

Regola 6: Soft-Delete Utenti (`/src/pages/AdminUsers.tsx`). L'azione di cancellazione degli utenti dalla dashboard amministratore è stata volutamente limitata tramite "Soft Delete". Si deve usare tassativamente `updateDoc(doc(db, 'users', userId), { isDeleted: true })`. È proibito usare `deleteDoc` per la collection 'users' o reintrodurre endpoint custom tipo `/api/users`. Questa funzionalità è bloccata e testata; non dovrà essere sovrascritta o ripristinata a metodi imperativi.

Regola 7: Configurazione Build e Server Entry Point. L'applicazione full-stack compila `server.ts` tramite esbuild nel file di immissione di produzione `dist/server.js` (non `server.cjs` o altro). Le impostazioni del build script in `package.json` o nel sistema ospitante (`"build": "vite build && esbuild server.ts --bundle --platform=node --format=esm --packages=external --sourcemap --outfile=dist/server.js"`) e lo start script (`"start": "node dist/server.js"`) NON DEVONO MAI ESSERE CAMBIATI. Qualsiasi configurazione su Hostinger o su altri server di produzione deve puntare a `dist/server.js` come Entry File principale. Questa impostazione bloccata e testata deve essere preservata senza alcuna eccezione.

