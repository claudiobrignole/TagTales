const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Artworks.tsx', 'set{t(\'artworks.reject\')}ingArtwork', 'setRejectingArtwork');
fixFile('./src/pages/Artworks.tsx', 'set{t(\'artworks.reject\')}Reason', 'setRejectReason');
fixFile('./src/pages/Artworks.tsx', '{t(\'artworks.reject\')}Reason', 'rejectReason');
fixFile('./src/pages/Artworks.tsx', 'submit{t(\'artworks.reject\')}', 'submitReject');

console.log('Fixed Reject issues');
