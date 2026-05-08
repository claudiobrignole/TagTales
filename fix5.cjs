const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/UploadArtwork.tsx', 'getFull{t(\'uploadArtwork.year\')}', 'getFullYear');

console.log('Fixed Year issues');
