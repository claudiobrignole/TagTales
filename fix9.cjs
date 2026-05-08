const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Profile.tsx', 'invoice{t(\'profile.language\')}', 'invoiceLanguage');
fixFile('./src/pages/Profile.tsx', 'set{t(\'profile.language\')}', 'setLanguage');
fixFile('./src/pages/Profile.tsx', '{t(\'profile.language\')}State', 'languageState');

console.log('Fixed Language issues');
