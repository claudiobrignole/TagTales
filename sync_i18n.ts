import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-3.1-pro";

const enJson = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf8'));
const files = ['it.json', 'fr.json', 'de.json', 'es.json'];

async function translate(text, langCode) {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        role: "user",
        parts: [{ text: `Translate the following UI text into ${langCode}. ONLY output the translation, no quotes unless in the text. Preserve placeholders like {{key}}.\n\nText: "${text}"` }]
      }]
    });
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (e) {
    console.error(`Error translating ${text} to ${langCode}:`, e);
    return text;
  }
}

async function syncObject(enObj, targetObj, langCode) {
  let updated = false;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (!targetObj[key]) {
        targetObj[key] = {};
        updated = true;
      }
      const childUpdated = await syncObject(enObj[key], targetObj[key], langCode);
      if (childUpdated) updated = true;
    } else {
      if (targetObj[key] === undefined) {
        console.log(`Translating [${langCode}] missing key: ${key} = ${enObj[key]}`);
        targetObj[key] = await translate(enObj[key], langCode);
        updated = true;
      }
    }
  }
  return updated;
}

async function run() {
  for (const file of files) {
    const langCode = file.split('.')[0];
    const targetJson = JSON.parse(fs.readFileSync(`./src/locales/${file}`, 'utf8'));
    console.log(`Syncing ${file}...`);
    const updated = await syncObject(enJson, targetJson, langCode);
    if (updated) {
      fs.writeFileSync(`./src/locales/${file}`, JSON.stringify(targetJson, null, 2));
      console.log(`Updated ${file}`);
    } else {
      console.log(`${file} is up to date.`);
    }
  }
}

run();
