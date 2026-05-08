const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  dashboard: {
    currency: {
      en: "Euro",
      it: "Euro",
      de: "Euro",
      fr: "Euro",
      es: "Euro"
    },
    uploadArtwork: {
      en: "Upload Artwork",
      it: "Carica Opera",
      de: "Kunstwerk hochladen",
      fr: "Télécharger une œuvre",
      es: "Subir Obra"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.dashboard) {
      data.dashboard = {};
    }

    Object.keys(newKeys.dashboard).forEach(key => {
      data.dashboard[key] = newKeys.dashboard[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
