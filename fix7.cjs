const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

// Payments.tsx
fixFile('./src/pages/Payments.tsx', 'set{t(\'payments.invoice\')}File', 'setInvoiceFile');
fixFile('./src/pages/Payments.tsx', '{t(\'payments.invoice\')}File', 'invoiceFile');

fixFile('./src/pages/Payments.tsx', 'set{t(\'common.amount\')}', 'setAmount');
fixFile('./src/pages/Payments.tsx', '{t(\'common.amount\')}', 'amount');

fixFile('./src/pages/Payments.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/Payments.tsx', '{t(\'common.status\')}', 'status');

// AdminPayments.tsx
fixFile('./src/pages/AdminPayments.tsx', 'set{t(\'payments.invoice\')}File', 'setInvoiceFile');
fixFile('./src/pages/AdminPayments.tsx', '{t(\'payments.invoice\')}File', 'invoiceFile');

fixFile('./src/pages/AdminPayments.tsx', 'set{t(\'common.amount\')}', 'setAmount');
fixFile('./src/pages/AdminPayments.tsx', '{t(\'common.amount\')}', 'amount');

fixFile('./src/pages/AdminPayments.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/AdminPayments.tsx', '{t(\'common.status\')}', 'status');

// Sales.tsx
fixFile('./src/pages/Sales.tsx', 'set{t(\'common.amount\')}', 'setAmount');
fixFile('./src/pages/Sales.tsx', '{t(\'common.amount\')}', 'amount');

fixFile('./src/pages/Sales.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/Sales.tsx', '{t(\'common.status\')}', 'status');

// AdminSales.tsx
fixFile('./src/pages/AdminSales.tsx', 'set{t(\'common.amount\')}', 'setAmount');
fixFile('./src/pages/AdminSales.tsx', '{t(\'common.amount\')}', 'amount');

fixFile('./src/pages/AdminSales.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/AdminSales.tsx', '{t(\'common.status\')}', 'status');

// Artworks.tsx
fixFile('./src/pages/Artworks.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/Artworks.tsx', '{t(\'common.status\')}', 'status');

// Contracts.tsx
fixFile('./src/pages/Contracts.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/Contracts.tsx', '{t(\'common.status\')}', 'status');

// AdminContracts.tsx
fixFile('./src/pages/AdminContracts.tsx', 'set{t(\'common.status\')}', 'setStatus');
fixFile('./src/pages/AdminContracts.tsx', '{t(\'common.status\')}', 'status');

console.log('Fixed Amount/Status/Invoice issues');
