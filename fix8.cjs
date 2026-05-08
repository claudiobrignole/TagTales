const fs = require('fs');
const path = require('path');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

const dir = './src/pages';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    fixFile(filePath, 'new {t(\'common.date\')}', 'new Date');
    fixFile(filePath, 'toLocale{t(\'common.date\')}String', 'toLocaleDateString');
  }
});

console.log('Fixed Date issues globally');
