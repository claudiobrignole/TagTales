const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Artworks.tsx', 'handle{t(\'artworks.approve\')}', 'handleApprove');
fixFile('./src/pages/Artworks.tsx', 'handle{t(\'artworks.reject\')}', 'handleReject');

console.log('Fixed Approve issues');
