const fs = require('fs');
const path = require('path');

const patchedTranslations = {
  it: {
    "artworks.statusApproved": "Approvato",
    "artworks.statusPending": "In Attesa",
    "artworks.statusSold": "Venduto",
    "artworks.statusDraft": "Bozza",
    "artworks.all": "Tutti"
  },
  de: {
    "artworks.statusApproved": "Genehmigt",
    "artworks.statusPending": "Ausstehend",
    "artworks.statusSold": "Verkauft",
    "artworks.statusDraft": "Entwurf",
    "artworks.all": "Alle"
  },
  fr: {
    "artworks.statusApproved": "Approuvé",
    "artworks.statusPending": "En Attente",
    "artworks.statusSold": "Vendu",
    "artworks.statusDraft": "Brouillon",
    "artworks.all": "Tous"
  },
  es: {
    "artworks.statusApproved": "Aprobado",
    "artworks.statusPending": "Pendiente",
    "artworks.statusSold": "Vendido",
    "artworks.statusDraft": "Borrador",
    "artworks.all": "Todos"
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
