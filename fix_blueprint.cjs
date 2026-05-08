const fs = require('fs');
let code = fs.readFileSync('firebase-blueprint.json', 'utf8');
code = code.replace(/}\s*"Writer":/g, '},\n    "Writer":');
fs.writeFileSync('firebase-blueprint.json', code);
