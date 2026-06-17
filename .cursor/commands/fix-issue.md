# Fix issue GitHub

Issue: $ARGUMENTS

1. `gh issue view $ARGUMENTS`
2. Trova file rilevanti nel codebase
3. Implementa fix minimale
4. `npm run lint && npm test && npm run build`
5. Commit su richiesta utente con riferimento all'issue
