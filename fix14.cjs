const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/AdminUsers.tsx', 'class{t(\'adminUsers.name\')}', 'className');
fixFile('./src/pages/AdminUsers.tsx', 'artist{t(\'adminUsers.name\')}', 'artistName');
fixFile('./src/pages/AdminUsers.tsx', 'full{t(\'adminUsers.name\')}', 'fullName');
fixFile('./src/pages/AdminUsers.tsx', 'bank{t(\'adminUsers.name\')}', 'bankName');

console.log('Fixed Name issues');
