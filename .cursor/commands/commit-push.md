# Commit e push su main

1. `git status` e `git diff` — verifica nessun segreto (.env, serviceAccountKey.json)
2. Esegui `npm run lint && npm test && npm run build`
3. Messaggio commit: `tipo: descrizione breve` (feat/fix/docs/test/refactor)
4. `git add` file rilevanti, `git commit`, `git push origin main`
5. Riporta hash commit e conferma push

Non committare se i test o la build falliscono.
