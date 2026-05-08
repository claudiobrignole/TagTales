const fs = require('fs');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\{t\('artworks\.confirm\{t\('artworks\.reject'\)\}ion'\)\}/g, "{t('artworks.confirmRejection')}");
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Artworks.tsx');

console.log('Fixed Rejection issues');
