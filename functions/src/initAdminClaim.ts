import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const initAdminClaim = onRequest(async (req: any, res: any) => {
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
  } catch (error) {
    logger.error('Error setting admin claim', error);
    res.status(500).send({ success: false, error: 'Internal error' });
  }
});
