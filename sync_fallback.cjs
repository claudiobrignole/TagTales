import fs from 'fs';

const files = ['it.json', 'fr.json', 'de.json', 'es.json'];
const enJson = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf8'));

function syncObject(enObj, targetObj) {
  let updated = false;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (!targetObj[key]) {
        targetObj[key] = {};
        updated = true;
      }
      if (syncObject(enObj[key], targetObj[key])) {
        updated = true;
      }
    } else {
      if (targetObj[key] === undefined) {
        targetObj[key] = enObj[key]; // Just use English string as fallback
        updated = true;
      }
    }
  }
  return updated;
}

for (const file of files) {
  const targetJson = JSON.parse(fs.readFileSync(`./src/locales/${file}`, 'utf8'));
  const updated = syncObject(enJson, targetJson);
  if (updated) {
    fs.writeFileSync(`./src/locales/${file}`, JSON.stringify(targetJson, null, 2));
    console.log(`Updated ${file}`);
  }
}
