const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/AdminUsers.tsx', '\'No {t(\\\'adminUsers.name\\\')}\'', '`No ${t(\'adminUsers.name\')}`');

console.log('Fixed No Name issues');
