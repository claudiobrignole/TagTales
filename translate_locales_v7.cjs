const fs = require('fs');
const path = require('path');

const patchedTranslations = {
  it: {
    "sales.thisMonth": "Questo Mese",
    "sales.last3Months": "Ultimi 3 Mesi",
    "sales.thisYear": "Quest'Anno",
    "sales.customRange": "Intervallo Personalizzato",
    "sales.custom": "Personalizzato",
    "artworks.searchPlaceholder": "Cerca opere...",
    "sales.searchPlaceholder": "Cerca vendite..."
  },
  de: {
    "sales.thisMonth": "Diesen Monat",
    "sales.last3Months": "Letzte 3 Monate",
    "sales.thisYear": "Dieses Jahr",
    "sales.customRange": "Benutzerdefiniert",
    "sales.custom": "Benutzerdefiniert",
    "artworks.searchPlaceholder": "Kunstwerke suchen...",
    "sales.searchPlaceholder": "Verkäufe suchen..."
  },
  fr: {
    "sales.thisMonth": "Ce Mois-ci",
    "sales.last3Months": "3 Derniers Mois",
    "sales.thisYear": "Cette Année",
    "sales.customRange": "Période Personnalisée",
    "sales.custom": "Personnalisé",
    "artworks.searchPlaceholder": "Rechercher des œuvres...",
    "sales.searchPlaceholder": "Rechercher des ventes..."
  },
  es: {
    "sales.thisMonth": "Este Mes",
    "sales.last3Months": "Últimos 3 Meses",
    "sales.thisYear": "Este Año",
    "sales.customRange": "Rango Personalizado",
    "sales.custom": "Personalizado",
    "artworks.searchPlaceholder": "Buscar obras...",
    "sales.searchPlaceholder": "Buscar ventas..."
  }
};

const localesDir = path.join(__dirname, 'src', 'locales');

for (const [lang, patches] of Object.entries(patchedTranslations)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) continue;
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  for (const [keyPath, value] of Object.entries(patches)) {
    const keys = keyPath.split('.');
    let current = content;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  console.log(`Updated ${lang}.json`);
}
