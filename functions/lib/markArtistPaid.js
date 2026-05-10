"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markArtistPaid = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.markArtistPaid = (0, https_1.onCall)(async (request) => {
    if (request.auth?.token?.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can mark artists as paid.');
    }
    const artistId = request.data.artistId;
    if (!artistId) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with an "artistId".');
    }
    try {
        const royaltiesRef = db.collection('royalties');
        const snapshot = await royaltiesRef
            .where('artistId', '==', artistId)
            .where('status', '==', 'pending')
            .get();
        const batch = db.batch();
        let paidCount = 0;
        snapshot.docs.forEach((doc) => {
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
    }
    catch (error) {
        logger.error('Error marking artist as paid:', error);
        throw new https_1.HttpsError('internal', 'Internal error occurred while marking artist as paid.');
    }
});
//# sourceMappingURL=markArtistPaid.js.map