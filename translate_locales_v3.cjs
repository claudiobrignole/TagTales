const fs = require('fs');
const path = require('path');

const baseTranslations = {
  de: {
    "artworks.video": "Video",
    "artworks.mod": "Modifizieren",
    "artworks.markSold": "Als Verkauft Markieren"
  },
  it: {
    "artworks.video": "Video",
    "artworks.mod": "Modifica",
    "artworks.markSold": "Segna come Venduto"
  },
  fr: {
    "artworks.video": "Vidéo",
    "artworks.mod": "Modifier",
    "artworks.markSold": "Marquer comme Vendu"
  },
  es: {
    "artworks.video": "Video",
    "artworks.mod": "Modificar",
    "artworks.markSold": "Marcar como Vendido"
  },
  en: {
    "artworks.video": "Video",
    "artworks.mod": "Mod",
    "artworks.markSold": "Mark Sold"
  }
};

const localesDir = path.join(__dirname, 'src', 'locales');
const languages = ['en', 'de', 'it', 'fr', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang + '.json');
  if (!fs.existsSync(filePath)) return;
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const patches = baseTranslations[lang] || {};
  
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
  console.log('Updated ' + lang + '.json');
});
