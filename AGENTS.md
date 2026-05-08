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
   - **H3 (Tertiary)**: `font-['Shamgod'] text-[40px] md:text-[60px] leading-[0.9]`
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

Regola 2: Il 'Golden Wrapper' Tailwind. Il contenitore del testo prose DEVE utilizzare ESATTAMENTE questa base intoccabile: className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla']". Qualsiasi variazione sui margini (my-2) o sul wrap (whitespace-pre-wrap) è vietata.

Regola 3: Divieto Assoluto di Hack CSS. È SEVERAMENTE VIETATO tentare di alterare il word-break o la sillabazione tramite: tag <style> iniettati nei componenti, varianti arbitrarie complesse come [&_*]:[word-break:...], o override globali in index.css.

Regola 4: Contenitori Flessibili Sicuri. Qualsiasi contenitore genitore (Flexbox o Grid) che avvolge un articolo o una pagina di testo deve implementare min-w-0 per permettere ai figli di restringersi correttamente, evitando overflow orizzontali.

