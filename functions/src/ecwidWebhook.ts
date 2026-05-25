import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

const ecwidClientSecret = defineSecret("ECWID_CLIENT_SECRET");
const ecwidStoreId = defineSecret("ECWID_STORE_ID");
const ecwidToken = defineSecret("ECWID_SECRET_TOKEN");
const sendfoxAccessTokenEn = defineSecret("SENDFOX_ACCESS_TOKEN");

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

const getVatRate = (countryCode: string): number => {
  const code = countryCode.toUpperCase().trim();
  const vatRates: Record<string, number> = {
    DE: 0.19, FR: 0.20, IT: 0.22, ES: 0.21, NL: 0.21, BE: 0.21, AT: 0.20, 
    PT: 0.23, PL: 0.23, SE: 0.25, DK: 0.25, FI: 0.24, GR: 0.24, IE: 0.23,
    CZ: 0.21, HU: 0.27, RO: 0.19, HR: 0.25, SK: 0.20, SI: 0.22, BG: 0.20,
    LT: 0.21, LV: 0.21, EE: 0.20, LU: 0.17, CY: 0.19, MT: 0.18
  };
  return vatRates[code] !== undefined ? vatRates[code] : 0.20;
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
  { secrets: [ecwidClientSecret, ecwidStoreId, ecwidToken, sendfoxAccessTokenEn], invoker: "public", rawBody: true, minInstances: 1 } as any,
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

    const providedSignature = req.headers['x-ecwid-signature'];
    const expectedSecret = ecwidClientSecret.value();

    if (!providedSignature || !req.rawBody) {
      logger.error("Missing signature or raw body");
      res.status(401).send("Unauthorized");
      return;
    }

    const calculatedSignature = crypto.createHmac('sha256', expectedSecret).update(req.rawBody).digest('base64');
    
    const providedBuffer = Buffer.from(providedSignature as string);
    const calculatedBuffer = Buffer.from(calculatedSignature);

    if (providedBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(providedBuffer, calculatedBuffer)) {
      logger.error("Invalid signature");
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
      const countryCode = String(orderData.billingPerson?.countryCode || "").toUpperCase().trim();

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
        const isStampaLimitata = productType === 'stampa_limitata';
        let stampaLimitataFields: any = {};

        if (feeOverride !== null && !isNaN(feeOverride)) {
          feePerUnit = feeOverride;
        } else if (isStampaLimitata) {
          const vatRate = getVatRate(countryCode);
          const priceExVatUnrounded = item.price / (1 + vatRate);
          const priceExVat = Math.round(priceExVatUnrounded * 100) / 100;
          feePerUnit = priceExVat - 90.00;
          
          if (feePerUnit <= 0) {
            logger.warn(`Stampa limitata feePerUnit calculated <= 0 (${feePerUnit}) for item ${item.id}, setting to 0`);
            feePerUnit = 0;
          }

          stampaLimitataFields = {
            countryCode,
            vatRate,
            grossPrice: item.price,
            priceExVat,
            platformFee: 90.00
          };
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
        const royaltyDoc: any = {
          artistId: artistId,
          orderId: String(orderId), // save as string just in case
          productType: productType,
          quantity: item.quantity,
          unitPrice: item.price,
          feeAmount: feeAmount,
          isPromo: isPromo,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp()
        };

        if (isStampaLimitata) {
          Object.assign(royaltyDoc, stampaLimitataFields);
        }

        batch.set(royaltyRef, royaltyDoc);

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

      // Automatically update limited edition quantities for exhibitions based on sold items
      try {
        const mostreSnap = await db.collection('mostre').get();
        for (const mostreDoc of mostreSnap.docs) {
          const mostraData = mostreDoc.data();
          let changed = false;
          if (mostraData.blocks && Array.isArray(mostraData.blocks)) {
            const updatedBlocks = mostraData.blocks.map((block: any) => {
              if (block.images && Array.isArray(block.images)) {
                let blockChanged = false;
                const updatedImages = block.images.map((img: any) => {
                  if (img.isLimitedEdition && img.ecwidLink) {
                    // Find if any sold item productId is present in this ecwidLink
                    const soldItem = items.find((itm: any) => {
                      const pId = String(itm.productId);
                      return img.ecwidLink.includes(pId);
                    });
                    if (soldItem) {
                      const currentQty = img.limitedEditionQuantity !== undefined ? img.limitedEditionQuantity : 0;
                      const newQty = Math.max(0, currentQty - soldItem.quantity);
                      logger.info(`Updating limited edition quantity for mostra ${mostreDoc.id}, block ${block.id}: from ${currentQty} to ${newQty}`);
                      blockChanged = true;
                      return {
                        ...img,
                        limitedEditionQuantity: newQty
                      };
                    }
                  }
                  return img;
                });
                if (blockChanged) {
                  changed = true;
                  return {
                    ...block,
                    images: updatedImages
                  };
                }
              }
              return block;
            });
            if (changed) {
              await mostreDoc.ref.update({ blocks: updatedBlocks });
            }
          }
        }
      } catch (exhibitionsErr) {
        logger.error("Failed to automatically update limited edition quantities on exhibitions", exhibitionsErr);
      }

      try {
        const pixelId = '1331292394239342';
        const accessToken = process.env.META_PIXEL_ACCESS_TOKEN;

        if (accessToken) {
          const eventTime = Math.floor(Date.now() / 1000);

          const purchasePayload = {
            data: [{
              event_name: 'Purchase',
              event_time: eventTime,
              action_source: 'website',
              custom_data: {
                currency: orderData.currency || 'EUR',
                value: orderData.total || 0,
                order_id: String(orderId),
                contents: items.map((item: any) => ({
                  id: String(item.productId),
                  quantity: item.quantity,
                  item_price: item.price
                }))
              }
            }]
          };

          const metaRes = await fetch(
            `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(purchasePayload)
            }
          );

          if (!metaRes.ok) {
            logger.warn('Meta Conversions API call failed', await metaRes.text());
          } else {
            logger.info('Meta Purchase event sent successfully');
          }
        } else {
          logger.warn('META_PIXEL_ACCESS_TOKEN not set, skipping Meta event');
        }
      } catch (metaError) {
        logger.warn('Meta Conversions API error (non-blocking)', metaError);
      }

      // 3. SendFox Newsletter auto-subscription with marketing consent (Punto C)
      try {
        const sendfoxToken = sendfoxAccessTokenEn.value().trim();
        const hasConsent = orderData.emailMarketingConsent && (
          orderData.emailMarketingConsent.consentStatus === 'opt_in' ||
          orderData.emailMarketingConsent.consentStatus === 'opt_in_from_checkout'
        );

        if (sendfoxToken && orderData.email && hasConsent) {
          logger.info(`Customer ${orderData.email} gave marketing consent. Attempting SendFox subscription...`);
          
          const sendfoxPayload: any = {
            email: orderData.email.trim(),
          };

          const nameParts = (orderData.billingPerson?.name || orderData.billingPerson?.firstName || "").trim();
          if (nameParts) {
            sendfoxPayload.first_name = nameParts;
          }

          const defaultListId = process.env.SENDFOX_DEFAULT_LIST_ID;
          if (defaultListId) {
            const listNum = parseInt(defaultListId, 10);
            if (!isNaN(listNum)) {
              sendfoxPayload.lists = [listNum];
            }
          }

          const sendfoxRes = await fetch("https://api.sendfox.com/contacts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${sendfoxToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(sendfoxPayload)
          });

          if (!sendfoxRes.ok) {
            const errText = await sendfoxRes.text();
            logger.warn(`SendFox API auto-enroll failure for ${orderData.email}:`, errText);
          } else {
            logger.info(`SendFox auto-enrollment completed successfully for ${orderData.email}`);
          }
        } else if (!sendfoxToken) {
          logger.info("SendFox access token is not configured in Firebase Secrets, skipping auto-enroll flow.");
        } else if (!hasConsent) {
          logger.info(`Customer ${orderData.email} did not opt-in for marketing consent. Consent status: ${orderData.emailMarketingConsent?.consentStatus || 'none'}`);
        }
      } catch (sfError) {
        logger.error("Non-blocking SendFox subscription error in webhook handler", sfError);
      }

      res.status(200).send("Webhook processed successfully");

    } catch (error) {
      logger.error("Error processing webhook", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
