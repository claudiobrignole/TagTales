/**
 * Istruzioni per l'esecuzione:
 * Assicurati di avere `ts-node` installato, o eseguilo con `npx ts-node`.
 * Devi avere le credenziali Admin disponibili o eseguire in un ambiente con GOOGLE_APPLICATION_CREDENTIALS.
 * 
 * Esempio di esecuzione:
 * npx ts-node scripts/setAdminClaim.ts admin@tagtales.com
 */

import * as admin from 'firebase-admin';

// Inizializza l'app admin (utilizza le credenziali di default o le variabili d'ambiente)
if (!admin.apps.length) {
  admin.initializeApp();
}

async function setAdminClaim() {
  const email = process.argv[2];

  if (!email) {
    console.error('Errore: Devi fornire un indirizzo email come argomento.');
    console.log('Uso: npx ts-node scripts/setAdminClaim.ts <email>');
    process.exit(1);
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    await admin.auth().setCustomUserClaims(uid, { admin: true });

    console.log(`Custom claim admin impostato per: ${email} (UID: ${uid})`);
    
    // Mostra anche i claims attuali per conferma
    const updatedRecord = await admin.auth().getUser(uid);
    console.log('Current claims:', updatedRecord.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('Errore durante l\\'impostazione del custom claim:', error);
    process.exit(1);
  }
}

setAdminClaim();
