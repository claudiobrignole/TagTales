const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Payments.tsx', 'export default function {t(\'payments.title\')}() {', 'export default function Payments() {');
fixFile('./src/pages/Payments.tsx', 'set{t(\'payments.title\')}', 'setPayments');
fixFile('./src/pages/Payments.tsx', 'fetch{t(\'payments.title\')}AndSales', 'fetchPaymentsAndSales');
fixFile('./src/pages/Payments.tsx', '<li>{t(\'payments.title\')} are processed within 3-5 business days.</li>', '<li>Payments are processed within 3-5 business days.</li>');

fixFile('./src/pages/Sales.tsx', 'export default function {t(\'sales.title\')}() {', 'export default function Sales() {');
fixFile('./src/pages/Sales.tsx', 'set{t(\'sales.title\')}', 'setSales');
fixFile('./src/pages/Sales.tsx', 'fetch{t(\'sales.title\')}', 'fetchSales');

fixFile('./src/pages/Contracts.tsx', 'export default function {t(\'contracts.title\')}() {', 'export default function Contracts() {');
fixFile('./src/pages/Contracts.tsx', 'set{t(\'contracts.title\')}', 'setContracts');
fixFile('./src/pages/Contracts.tsx', 'fetch{t(\'contracts.title\')}', 'fetchContracts');

fixFile('./src/pages/Artworks.tsx', 'export default function {t(\'artworks.title\')}() {', 'export default function Artworks() {');
fixFile('./src/pages/Artworks.tsx', 'set{t(\'artworks.title\')}', 'setArtworks');
fixFile('./src/pages/Artworks.tsx', 'fetch{t(\'artworks.title\')}', 'fetchArtworks');

fixFile('./src/pages/AdminDashboard.tsx', 'export default function {t(\'adminDashboard.title\')}() {', 'export default function AdminDashboard() {');
fixFile('./src/pages/AdminUsers.tsx', 'export default function {t(\'adminUsers.title\')}() {', 'export default function AdminUsers() {');
fixFile('./src/pages/AdminSales.tsx', 'export default function {t(\'sales.allSalesTitle\')}() {', 'export default function AdminSales() {');
fixFile('./src/pages/AdminPayments.tsx', 'export default function {t(\'payments.allPaymentsTitle\')}() {', 'export default function AdminPayments() {');
fixFile('./src/pages/AdminContracts.tsx', 'export default function {t(\'contracts.allContractsTitle\')}() {', 'export default function AdminContracts() {');

console.log('Fixed files');
