import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';

const rawConfig = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(rawConfig);
const app = initializeApp(config);
const db = getFirestore(app);

const buildPages = async () => {
    const pages = [
        {
            id: 'home',
            data: {
                titolo: 'Home Page',
                contenuto: 'Benvenuti nel nostro collettivo artistico. Esplora le opere e gli artisti.'
            }
        },
        {
            id: 'faq',
            data: {
                titolo: 'Domande Frequenti (FAQ)',
                contenuto: 'Qui puoi trovare risposte alle domande più comuni sulla nostra galleria e sulle mostre.'
            }
        },
        {
            id: 'contatti',
            data: {
                titolo: 'Contatti',
                contenuto: 'Contattaci per informazioni, collaborazioni o per visitare la nostra galleria.'
            }
        }
    ];

    for (const page of pages) {
        await setDoc(doc(db, 'pagine', page.id), page.data, { merge: true });
        console.log(`Created/updated page: ${page.id}`);
    }
    console.log("Done.");
    process.exit(0);
};

buildPages().catch(console.error);
