const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');
code = code.replace(/\/mostre\/shaone/g, '/minimostre/shaone');
code = code.replace(/\/mostre\/urban-echo/g, '/minimostre/urban-echo');
code = code.replace(/\/mostre\/phase2/g, '/minimostre/phase2');
code = code.replace(/"\/mostre"/g, '"/minimostre"');
fs.writeFileSync('src/pages/PublicHome.tsx', code);
