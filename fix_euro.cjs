const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace €500 or € 500 or €500.00 with 500 Euro
    content = content.replace(/€\s*(\d+(\.\d+)?)/g, '$1 Euro');
    // Replace 500 € or 500€ or 500.00 € with 500 Euro
    content = content.replace(/(\d+(\.\d+)?)\s*€/g, '$1 Euro');
    // Replace €{{amount}} or € {{amount}} with {{amount}} Euro
    content = content.replace(/€\s*\{\{(\w+)\}\}/g, '{{$1}} Euro');
    // Replace {{amount}} € or {{amount}}€ with {{amount}} Euro
    content = content.replace(/\{\{(\w+)\}\}\s*€/g, '{{$1}} Euro');

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${locale}.json`);
  }
});
