const fs = require('fs');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/'No \{t\('adminUsers\.name'\)\}'/g, "`No ${t('adminUsers.name')}`");
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/AdminUsers.tsx');

console.log('Fixed No Name issues');
