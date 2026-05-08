const fs = require('fs');
const path = require('path');

const addI18n = (filePath, componentName) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('useI18n')) return;

  // Add import
  const importStatement = `import { useI18n } from '../contexts/I18nContext';\n`;
  // Find last import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    lines.unshift(importStatement);
  }

  content = lines.join('\n');

  // Add hook inside component
  const hookStatement = `  const { t } = useI18n();\n`;
  const componentRegex = new RegExp(`(export default function ${componentName}\\s*\\([^)]*\\)\\s*{)`);
  content = content.replace(componentRegex, `$1\n${hookStatement}`);

  fs.writeFileSync(filePath, content);
  console.log(`Added useI18n to ${filePath}`);
};

addI18n('./src/pages/Artworks.tsx', 'Artworks');
addI18n('./src/pages/UploadArtwork.tsx', 'UploadArtwork');
addI18n('./src/pages/Sales.tsx', 'Sales');
addI18n('./src/pages/Payments.tsx', 'Payments');
addI18n('./src/pages/Contracts.tsx', 'Contracts');
addI18n('./src/pages/AdminDashboard.tsx', 'AdminDashboard');
addI18n('./src/pages/AdminUsers.tsx', 'AdminUsers');
addI18n('./src/pages/AdminSales.tsx', 'AdminSales');
addI18n('./src/pages/AdminPayments.tsx', 'AdminPayments');
addI18n('./src/pages/AdminContracts.tsx', 'AdminContracts');
addI18n('./src/components/EcwidConnectionModal.tsx', 'EcwidConnectionModal');
addI18n('./src/components/ConnectionBanner.tsx', 'ConnectionBanner');

