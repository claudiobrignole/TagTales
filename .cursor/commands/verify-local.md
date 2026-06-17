# Verifica locale TagTales

1. Verifica porta 3000 libera; se occupata: `lsof -ti:3000 | xargs kill -9`
2. `npm run dev` — attendi "Server running" e "Firebase Admin inizializzato" (se service account presente)
3. `npm run lint && npm test`
4. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` — atteso 200
5. Opzionale browser: `/login` → "Dev: accedi come admin" → `/app/admin`
6. Riporta esito di ogni step
