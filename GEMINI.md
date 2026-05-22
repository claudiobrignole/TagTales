# TagTales Gallery - Project Context & Guidelines

## 1. Project Overview
TagTales Gallery is a full-stack web application designed for the graffiti subculture. It connects writers (artists) with collectors through "mini-exhibitions", original artworks, and limited edition prints.
- **Goal**: Provide an authentic platform for the graffiti culture without artificial intelligence generation, focusing on original style and human stories.

## 2. Design Philosophy & Rules (CRITICAL)
- **Primary Typography**:
  - **Headings/Titles** (Shamgod): **MUST** be uppercase. `font-['Shamgod']`, tight line-height (`leading-[0.8]`), no tracking (`tracking-normal`).
  - **Body Text** (Karla): `font-['Karla']`.
  - **Buttons/Labels/Small Titles**: **Karla Bold**, **MUST** be uppercase (`uppercase`, `tracking-wider`).
- **Layout**: Ensure use of `PublicLayout` for all public pages (Header/Footer included).

## 3. Technology Stack
- **Frontend**: React 18+ (Vite), TypeScript, Tailwind CSS.
- **Backend/Services**: Firebase (Firestore, Auth, Storage).
- **Styling**: Tailwind CSS only (no separate CSS files, no `style` attributes).
- **Icons**: `lucide-react`.

## 4. Internationalization
- **Primary Language**: Italian (`it`).
- **Supported Languages**: IT (primary), EN.
- **Translation Strategy**: Translations are automatically generated whenever new text elements are created.
- **Key Files**: `/src/locales/it.json`, `/src/locales/en.json`. Use `t()` function for translations.

## 5. Development Status
- **Completed**:
  - Full UI (Dashboard/Public pages).
  - Multi-language system (translation keys implemented).
  - Refactoring from "Artist" to "Writer".
  - Populate with real content (legendary writers).
  - Writer Onboarding/Authentication/Sales Tracking flows.
- **Current Focus**:
  - SEO Optimization (Meta tags, OpenGraph, dynamic headers).

## 6. Communication/Coding Rules for Agent
- Follow user-defined rules in `AGENTS.md` and this file.
- Action over talk: summarize after finishing a chunk of work.
- Always verify dependencies and schema before editing code.
- Prioritize server-side operations for API keys.
- **SEO priority**: Every new public page MUST have appropriate SEO meta-data added.
- **Server Entry Point & Build Config**: The backend service compiled entry point under `dist/server.js` and build configurations specify that the environment compiles `server.ts` directly into `dist/server.js`. These must **NEVER** be changed, and any deployment settings on platforms (like Hostinger) must strictly target `dist/server.js` as the Server Entry File.
