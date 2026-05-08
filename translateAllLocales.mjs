import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const rootDir = path.join(__dirname, 'src', 'locales');
  const enPath = path.join(rootDir, 'en.json');
  const enContent = fs.readFileSync(enPath, 'utf-8');

  const languages = [
    { code: 'it', name: 'Italian' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
  ];

  for (const lang of languages) {
    console.log(`Translating to ${lang.name}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert translator. Translate the following JSON from English to ${lang.name}. 
Keep the JSON structure exactly identical. Keep all keys exactly identical. 
Only translate the string values. Do not translate variables wrapped in {{...}} like {{name}}.
Return ONLY pure JSON. Do NOT wrap in \`\`\`json markdown blocks, just raw JSON text.

Here is the English JSON:
${enContent}
`
      });
      let out = response.text.trim();
      if (out.startsWith('```json')) {
        out = out.replace(/```json\n?/, '').replace(/```$/, '').trim();
      } else if (out.startsWith('```')) {
        out = out.replace(/```\n?/, '').replace(/```$/, '').trim();
      }
      
      // Test if it parses
      JSON.parse(out);
      
      fs.writeFileSync(path.join(rootDir, `${lang.code}.json`), out);
      console.log(`Saved ${lang.code}.json successfully.`);
    } catch (err) {
      console.error(`Error translating to ${lang.name}:`, err);
    }
  }
}

run();
