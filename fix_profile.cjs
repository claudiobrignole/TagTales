const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  profile: {
    artistName: {
      en: "Artist Name",
      it: "Nome Artista",
      de: "Künstlername",
      fr: "Nom de l'artiste",
      es: "Nombre del Artista"
    },
    bio: {
      en: "Bio",
      it: "Biografia",
      de: "Bio",
      fr: "Biographie",
      es: "Biografía"
    },
    website: {
      en: "Website",
      it: "Sito Web",
      de: "Webseite",
      fr: "Site Web",
      es: "Sitio Web"
    },
    instagram: {
      en: "Instagram",
      it: "Instagram",
      de: "Instagram",
      fr: "Instagram",
      es: "Instagram"
    },
    vatNumber: {
      en: "VAT Number",
      it: "Partita IVA",
      de: "Umsatzsteuer-Identifikationsnummer",
      fr: "Numéro de TVA",
      es: "Número de IVA"
    },
    accountHolder: {
      en: "Account Holder",
      it: "Titolare del Conto",
      de: "Kontoinhaber",
      fr: "Titulaire du Compte",
      es: "Titular de la Cuenta"
    },
    bankName: {
      en: "Bank Name",
      it: "Nome Banca",
      de: "Bankname",
      fr: "Nom de la Banque",
      es: "Nombre del Banco"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.profile) {
      data.profile = {};
    }

    Object.keys(newKeys.profile).forEach(key => {
      data.profile[key] = newKeys.profile[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
