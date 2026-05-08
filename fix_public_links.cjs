const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');
code = code.replace(/href="#minimostre"/g, 'href="/minimostre"');
code = code.replace(/href="#writers"/g, 'href="/writers"');
code = code.replace(/href="#magazine"/g, 'href="/magazine"');
fs.writeFileSync('src/pages/PublicHome.tsx', code);
