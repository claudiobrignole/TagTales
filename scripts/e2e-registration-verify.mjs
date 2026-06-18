/**
 * Verify or cleanup a test user created during registration E2E.
 * Usage:
 *   node scripts/e2e-registration-verify.mjs verify <email>
 *   node scripts/e2e-registration-verify.mjs cleanup <email>
 */
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

dotenv.config({ quiet: true });

function initFirebaseAdmin() {
  if (getApps().length) return;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const keyPath = [
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'var/serviceAccountKey.json'),
  ].find((p) => fs.existsSync(p));

  let credential;
  if (b64) {
    credential = cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8')));
  } else if (raw) {
    credential = cert(JSON.parse(raw));
  } else if (keyPath) {
    credential = cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')));
  } else {
    throw new Error('Firebase Admin credentials not configured');
  }

  initializeApp({ credential });
}

function getDb() {
  const cfg = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8'),
  );
  const dbId = cfg.firestoreDatabaseId;
  return dbId ? getFirestore(getApps()[0], dbId) : getFirestore();
}

const email = process.argv[3];
const action = process.argv[2] || 'verify';

async function main() {
  if (!email) {
    console.error('Usage: node scripts/e2e-registration-verify.mjs <verify|cleanup> <email>');
    process.exit(1);
  }

  initFirebaseAdmin();
  const auth = getAuth();
  const db = getDb();

  const user = await auth.getUserByEmail(email);
  const userDoc = await db.collection('users').doc(user.uid).get();

  if (action === 'cleanup') {
    await db.collection('users').doc(user.uid).delete();
    await auth.deleteUser(user.uid);
    console.log(JSON.stringify({ cleaned: true, uid: user.uid, email }));
    return;
  }

  let verificationLink = null;
  try {
    verificationLink = await auth.generateEmailVerificationLink(email);
  } catch (err) {
    verificationLink = null;
  }

  console.log(
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      firestoreProfileExists: userDoc.exists,
      firestoreRole: userDoc.exists ? userDoc.data()?.role : null,
      verificationLinkGenerated: Boolean(verificationLink),
    }),
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
