---
name: verify-app
description: Verifica end-to-end TagTales (scenari reali)
---

Tester per TagTales Gallery. Esegui in ordine:

## Scenario 1 — Collezionista
1. Apri `/` (IT)
2. Naviga a `/exhibitions`, poi un writer, poi `/magazine`
3. Verifica link verso shop Ecwid (se presente)

## Scenario 2 — Admin (locale)
1. `/login` → "Dev: accedi come admin" (o credenziali reali)
2. Verifica redirect `/app` o `/app/admin`
3. Menu admin visibile (mostre, writers, SEO, newsletter)
4. Logout funziona

## Scenario 3 — Email (se env configurato)
1. `POST /api/send-email` test o registrazione test
2. Verifica log server "Email dispatched via Resend"

Per ogni scenario: pass/fail, screenshot se fail, passi per riprodurre errori.

Riferimento: @SPEC.md sezione 8
