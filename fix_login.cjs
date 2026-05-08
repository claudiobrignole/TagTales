const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  login: {
    processing: {
      en: "Processing...",
      it: "Elaborazione...",
      de: "Verarbeitung...",
      fr: "Traitement...",
      es: "Procesando..."
    },
    or: {
      en: "OR",
      it: "O",
      de: "ODER",
      fr: "OU",
      es: "O"
    },
    continueWithGoogle: {
      en: "Continue with Google",
      it: "Continua con Google",
      de: "Weiter mit Google",
      fr: "Continuer avec Google",
      es: "Continuar con Google"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.login) {
      data.login = {};
    }

    Object.keys(newKeys.login).forEach(key => {
      data.login[key] = newKeys.login[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
