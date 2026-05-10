import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const markArtistPaid = onCall(async (request: any) => {
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Only admins can mark artists as paid.');
  }

  const artistId = request.data.artistId;
  if (!artistId) {
    throw new HttpsError('invalid-argument', 'The function must be called with an "artistId".');
  }

  try {
    const royaltiesRef = db.collection('royalties');
    const snapshot = await royaltiesRef
      .where('artistId', '==', artistId)
      .where('status', '==', 'pending')
      .get();

    const batch = db.batch();
    let paidCount = 0;

    snapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        status: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
      paidCount++;
    });

    const artistRef = db.collection('users').doc(artistId);
    batch.update(artistRef, {
      pendingBalance: 0
    });

    await batch.commit();

    return { success: true, paidCount };
  } catch (error) {
    logger.error('Error marking artist as paid:', error);
    throw new HttpsError('internal', 'Internal error occurred while marking artist as paid.');
  }
});
