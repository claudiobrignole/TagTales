"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAdminClaim = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.initAdminClaim = (0, https_1.onRequest)(async (req, res) => {
    const email = req.query.email;
    if (!email || typeof email !== 'string') {
        res.status(400).send("Please provide ?email= parameter");
        return;
    }
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        logger.info(`Admin claim set for ${email} (UID: ${userRecord.uid})`);
        res.status(200).send({ success: true, message: `Admin claim set for ${email}` });
    }
    catch (error) {
        logger.error('Error setting admin claim', error);
        res.status(500).send({ success: false, error: 'Internal error' });
    }
});
//# sourceMappingURL=initAdminClaim.js.map