const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Artworks.tsx', '{t(\'artworks.confirm{t(\\\'artworks.reject\\\')}ion\')}', '{t(\'artworks.confirmRejection\')}');

console.log('Fixed Rejection issues');
