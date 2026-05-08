const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Artworks.tsx', '{t(\'artworks.approve\')}d', 'Approved');
fixFile('./src/pages/Artworks.tsx', '{t(\'artworks.reject\')}ed', 'Rejected');

console.log('Fixed Approved/Rejected issues');
