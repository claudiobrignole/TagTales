const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/AdminUsers.tsx', 'toggleAdmin{t(\'adminUsers.role\')}', 'toggleAdminRole');
fixFile('./src/pages/AdminUsers.tsx', 'current{t(\'adminUsers.role\')}', 'currentRole');
fixFile('./src/pages/AdminUsers.tsx', 'new{t(\'adminUsers.role\')}', 'newRole');

console.log('Fixed Role issues');
