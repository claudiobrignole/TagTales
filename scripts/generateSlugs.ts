import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateSlug } from '../src/utils/slugify.ts';

// Setup dei percorsi (necessario in moduli ES)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso al file serviceAccountKey.json 
// Mettilo nella cartella root o in var/
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(` ERRORE: File serviceAccountKey.json non trovato in ${serviceAccountPath}`);
  console.error(" Scaricalo dalla Firebase Console e posizionalo nel percorso corretto.");
  process.exit(1);
}

// Inizializza Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Configurazione delle collection da migrare e il campo da cui generare lo slug
const collectionsToMigrate = [
  { name: 'scrittori', sourceField: 'nickname' }, // Verifica se il campo si chiama 'nickname' o 'nome'
  { name: 'mostre', sourceField: 'titolo' },
  { name: 'articoli', sourceField: 'titolo' }
];

async function generateSlugs() {
  console.log("Inizio migrazione degli slug...");

  for (const collectionConfig of collectionsToMigrate) {
    console.log(`\n Migrazione collection: ${collectionConfig.name}`);
    const snapshot = await db.collection(collectionConfig.name).get();
    
    if (snapshot.empty) {
      console.log(`Nessun documento trovato in ${collectionConfig.name}.`);
      continue;
    }

    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Se lo slug esiste già, non sovrascrivere per preservare vecchi URL, a meno che non si voglia forzare.
      // Se vuoi forzare l'aggiornamento, commenta le due righe sotto:
      if (data.slug) {
        console.log(`  - Salta [${doc.id}]: ha già uno slug (${data.slug})`);
        continue;
      }

      const sourceValue = data[collectionConfig.sourceField];
      if (!sourceValue) {
        console.log(`  - Salta [${doc.id}]: campo '${collectionConfig.sourceField}' mancante o vuoto`);
        continue;
      }

      let baseSlug = generateSlug(sourceValue);
      let finalSlug = baseSlug;
      let suffix = 2;

      // Logica per rendere lo slug univoco (molto semplificata: cerca duplicati nella stessa collection)
      // Nota: in produzione dovremmo usare query in loop, gestito con while.
      let slugExists = true;
      while (slugExists) {
        const existingDocs = await db.collection(collectionConfig.name).where('slug', '==', finalSlug).get();
        if (existingDocs.empty) {
          slugExists = false; // Slug univoco trovato
        } else {
          finalSlug = `${baseSlug}-${suffix}`;
          suffix++;
        }
      }

      // Aggiorna il documento
      await doc.ref.update({ slug: finalSlug });
      console.log(`  + Aggiornato [${doc.id}]: ${sourceValue} -> ${finalSlug}`);
      updatedCount++;
    }

    console.log(` Completata ${collectionConfig.name}: aggiornati ${updatedCount} documenti.`);
  }

  console.log("\n Migrazione completata con successo!");
}

generateSlugs().catch(console.error);
