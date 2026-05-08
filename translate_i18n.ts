import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'src', 'locales');
const languages = ['it', 'de', 'es', 'fr'];

async function translateMissingKeys() {
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));

  for (const lang of languages) {
    const langPath = path.join(localesDir, `${lang}.json`);
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));

    await translateObject(en, langData, lang);

    fs.writeFileSync(langPath, JSON.stringify(langData, null, 2));
    console.log(`Updated ${lang}.json`);
  }
}

async function translateObject(enObj: any, langObj: any, lang: string) {
  for (const key in enObj) {
    if (typeof enObj[key] === 'object') {
      if (!langObj[key]) langObj[key] = {};
      await translateObject(enObj[key], langObj[key], lang);
    } else {
      if (!langObj[key] || langObj[key] === '') {
        console.log(`Translating ${key} to ${lang}...`);
        try {
          const response = await fetch('http://localhost:3000/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: enObj[key], targetLanguages: [lang] })
          });
          const data = await response.json();
          langObj[key] = data[lang];
        } catch (e) {
          console.error(`Failed to translate ${key} to ${lang}:`, e);
        }
      }
    }
  }
}

translateMissingKeys();
