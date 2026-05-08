const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

// Sales.tsx
fixFile('./src/pages/Sales.tsx', 'set{t(\'common.date\')}Range', 'setDateRange');
fixFile('./src/pages/Sales.tsx', 'customStart{t(\'common.date\')}', 'customStartDate');
fixFile('./src/pages/Sales.tsx', 'setCustomStart{t(\'common.date\')}', 'setCustomStartDate');
fixFile('./src/pages/Sales.tsx', 'customEnd{t(\'common.date\')}', 'customEndDate');
fixFile('./src/pages/Sales.tsx', 'setCustomEnd{t(\'common.date\')}', 'setCustomEndDate');
fixFile('./src/pages/Sales.tsx', 'new {t(\'common.date\')}', 'new Date');
fixFile('./src/pages/Sales.tsx', '{t(\'common.date\')}Range', 'dateRange');

// AdminSales.tsx
fixFile('./src/pages/AdminSales.tsx', 'set{t(\'common.date\')}Range', 'setDateRange');
fixFile('./src/pages/AdminSales.tsx', 'customStart{t(\'common.date\')}', 'customStartDate');
fixFile('./src/pages/AdminSales.tsx', 'setCustomStart{t(\'common.date\')}', 'setCustomStartDate');
fixFile('./src/pages/AdminSales.tsx', 'customEnd{t(\'common.date\')}', 'customEndDate');
fixFile('./src/pages/AdminSales.tsx', 'setCustomEnd{t(\'common.date\')}', 'setCustomEndDate');
fixFile('./src/pages/AdminSales.tsx', 'new {t(\'common.date\')}', 'new Date');
fixFile('./src/pages/AdminSales.tsx', '{t(\'common.date\')}Range', 'dateRange');

// Payments.tsx
fixFile('./src/pages/Payments.tsx', 'new {t(\'common.date\')}', 'new Date');
fixFile('./src/pages/AdminPayments.tsx', 'new {t(\'common.date\')}', 'new Date');

// Contracts.tsx
fixFile('./src/pages/Contracts.tsx', 'new {t(\'common.date\')}', 'new Date');
fixFile('./src/pages/AdminContracts.tsx', 'new {t(\'common.date\')}', 'new Date');

console.log('Fixed Date issues');
