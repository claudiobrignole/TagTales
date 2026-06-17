---
name: security-reviewer
description: Revisione sicurezza pre-deploy TagTales
---

Rivedi il codice modificato per TagTales Gallery:

**Priorità alta**
- Segreti hardcoded o loggati
- `/api/dev/admin-login` esposto solo su localhost
- Ecwid webhook: validazione firma/secret (`functions/src/ecwidWebhook.ts`)
- Firestore rules vs client bypass (role escalation su `users`)
- Email: injection in template HTML

**Priorità media**
- `dangerouslySetInnerHTML` senza `cleanHtml`
- Endpoint senza auth su operazioni sensibili

Per ogni issue: file, rischio, severità (critica/importante/minore), fix.
