const fs = require('fs');
['en', 'it', 'fr', 'es', 'de'].forEach(lang => {
  const file = 'src/locales/' + lang + '.json';
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.nav) data.nav = {};
    if (lang === 'it') data.nav.translations = 'Traduzioni';
    else if (lang === 'en') data.nav.translations = 'Translations';
    else if (lang === 'fr') data.nav.translations = 'Traductions';
    else if (lang === 'es') data.nav.translations = 'Traducciones';
    else if (lang === 'de') data.nav.translations = 'Übersetzungen';
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
});
