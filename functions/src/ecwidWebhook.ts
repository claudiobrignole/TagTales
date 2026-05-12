import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const ecwidWebhookSecret = defineSecret("ECWID_WEBHOOK_SECRET");
const ecwidStoreId = defineSecret("ECWID_STORE_ID");
const ecwidToken = defineSecret("ECWID_SECRET_TOKEN");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const FEE_TABLE: Record<string, { full: number; promo: number } | null> = {
  tshirt:       { full: 7.00,  promo: 4.00  },
  felpa:        { full: 9.00,  promo: 5.00  },
  poster_a2:    { full: 17.00, promo: 12.00 },
  poster_a1:    { full: 19.00, promo: 13.00 },
  tela_12x18:   { full: 93.00, promo: 67.00 },
  tela_16x24:   { full: 111.00, promo: 81.00 },
  tela_20x30:   { full: 124.00, promo: 90.00 },
  tela_40x60:   { full: 164.00, promo: 104.00 },
  stampa_limitata: null  // calcolata come: prezzo_vendita - 90.00
};

const getAttribute = (item: any, attrName: string): any => {
  if (item[attrName] !== undefined) return item[attrName];
  if (item.attributes && Array.isArray(item.attributes)) {
    const attr = item.attributes.find((a: any) => a.name === attrName || a.internalName === attrName);
    if (attr) return attr.value;
  }
  if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
    const opt = item.selectedOptions.find((o: any) => o.name === attrName);
    if (opt) return opt.value;
  }
  return undefined;
};

export const ecwidWebhook = onRequest(
  { secrets: [ecwidWebhookSecret, ecwidStoreId, ecwidToken], invoker: "public" },
  async (req: any, res: any) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const eventType = req.body.eventType;
    if (eventType !== "order.created") {
      res.status(200).send("Event ignored");
      return;
    }

    const providedSecret = req.headers['x-ecwid-secret'];
    const expectedSecret = ecwidWebhookSecret.value();

    if (providedSecret !== expectedSecret) {
      logger.error("Invalid secret");
      res.status(401).send("Unauthorized");
      return;
    }

    const orderId = req.body.entityId;
    if (!orderId) {
      res.status(400).send("Missing orderId");
      return;
    }

    try {
      const storeId = ecwidStoreId.value();
      const token = ecwidToken.value();

      const orderRes = await fetch(`https://app.ecwid.com/api/v3/${storeId}/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!orderRes.ok) {
        logger.error(`Failed to fetch order ${orderId} from Ecwid. Status: ${orderRes.status}`);
        res.status(500).send("Failed to fetch order details");
        return;
      }

      const orderData = await orderRes.json();
      
      if (orderData.paymentStatus !== "PAID") {
        logger.info(`Order ${orderId} ignored: paymentStatus=${orderData.paymentStatus}`);
        res.status(200).send("Order not paid, ignored");
        return;
      }

      const items = orderData.items || [];

      const batch = db.batch();
      const artistFees: Record<string, number> = {};

      for (const item of items) {
        let productType = getAttribute(item, 'product_type');
        const artistId = getAttribute(item, 'artist_id');
        const promoActiveStr = getAttribute(item, 'promo_active');
        const feeOverrideStr = getAttribute(item, 'fee_override');
        const feeOverride = feeOverrideStr !== undefined ? parseFloat(feeOverrideStr) : null;
        
        if (!productType) {
          logger.warn(`Missing product_type for item ${item.id}`);
          continue;
        }
        if (!artistId) {
          logger.info(`Item ${item.id} has no artist_id (internal product), skipping royalty.`);
          continue;
        }

        // Normalize string
        productType = String(productType).toLowerCase();
        
        const isPromo = String(promoActiveStr).toLowerCase() === 'true' || 
                        String(promoActiveStr) === '1' || 
                        String(promoActiveStr).toLowerCase() === 'yes';

        let feePerUnit = 0;

        if (feeOverride !== null && !isNaN(feeOverride)) {
          feePerUnit = feeOverride;
        } else if (productType === 'stampa_limitata') {
          feePerUnit = item.price - 90.00;
        } else if (FEE_TABLE[productType]) {
          feePerUnit = isPromo ? FEE_TABLE[productType]!.promo : FEE_TABLE[productType]!.full;
        } else {
          logger.warn(`Unknown product_type: ${productType}`);
          continue;
        }

        feePerUnit = Math.max(0, feePerUnit);
        
        const totalFeeObj = feePerUnit * item.quantity;
        const feeAmount = Math.round(totalFeeObj * 100) / 100;

        // 1. Write to royalties collection
        const royaltyRef = db.collection('royalties').doc();
        batch.set(royaltyRef, {
          artistId: artistId,
          orderId: String(orderId), // save as string just in case
          productType: productType,
          quantity: item.quantity,
          unitPrice: item.price,
          feeAmount: feeAmount,
          isPromo: isPromo,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp()
        });

        // Accumulate for artist update
        if (!artistFees[artistId]) {
          artistFees[artistId] = 0;
        }
        artistFees[artistId] += feeAmount;
      }

      // 2. Update users pendingBalance and totalEarned
      for (const [artistId, totalFee] of Object.entries(artistFees)) {
        if (totalFee > 0) {
          const artistRef = db.collection('users').doc(artistId);
          batch.set(artistRef, {
            pendingBalance: FieldValue.increment(totalFee),
            totalEarned: FieldValue.increment(totalFee)
          }, { merge: true });
        }
      }

      await batch.commit();

      res.status(200).send("Webhook processed successfully");

    } catch (error) {
      logger.error("Error processing webhook", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
