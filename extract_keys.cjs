const fs = require('fs');
const path = require('path');

function getKeys(dir) {
  let keys = new Set();
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      getKeys(fullPath).forEach(k => keys.add(k));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/t\('([^']+)'/g);
      if (matches) {
        matches.forEach(m => {
          keys.add(m.match(/t\('([^']+)'/)[1]);
        });
      }
    }
  }
  return keys;
}

const keys = Array.from(getKeys(path.join(__dirname, 'src')));
keys.sort();
console.log(keys.join('\n'));
