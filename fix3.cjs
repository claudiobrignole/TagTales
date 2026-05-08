const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/'\{t\('([^']+)'\)\}'/g, "t('$1')");
  content = content.replace(/"\{t\('([^']+)'\)\}"/g, "t('$1')");
  fs.writeFileSync(filePath, content);
};

const dir = './src/pages';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    fixFile(path.join(dir, file));
  }
});
fixFile('./src/components/EcwidConnectionModal.tsx');
fixFile('./src/components/ConnectionBanner.tsx');

console.log('Fixed quotes around t()');
