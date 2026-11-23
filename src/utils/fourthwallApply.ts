import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { OrderPlan } from "./fourthwallOrderPlan.ts";

/** Writes royalties on the named Firestore already used by the app. Retries do not add the fee twice. */
export async function applyFourthwallPlan(db: Firestore, plan: OrderPlan): Promise<void> {
  const royaltyRefs = plan.lines.map((line) => db.collection("royalties").doc(line.royaltyId));
  const alertRefs = plan.alerts.map((alert) => db.collection("fourthwall_alerts").doc(alert.id));

  await db.runTransaction(async (tx) => {
    const royaltySnaps = await Promise.all(royaltyRefs.map((ref) => tx.get(ref)));
    const alertSnaps = await Promise.all(alertRefs.map((ref) => tx.get(ref)));

    plan.lines.forEach((line, index) => {
      const snap = royaltySnaps[index];
      const ref = royaltyRefs[index];
      if (plan.cancelled) {
        if (!snap.exists || snap.data()?.status !== "pending") return;
        const fee = Number(snap.data()?.feeAmount || 0);
        tx.update(ref, {
          status: "cancelled",
          cancelledAt: FieldValue.serverTimestamp(),
        });
        if (fee > 0) {
          tx.set(db.collection("users").doc(line.artistId), {
            pendingBalance: FieldValue.increment(-fee),
            totalEarned: FieldValue.increment(-fee),
          }, { merge: true });
        }
        return;
      }
      if (snap.exists) return;
      tx.set(ref, {
        artistId: line.artistId,
        orderId: line.orderId,
        friendlyId: line.friendlyId,
        productId: line.productId,
        productName: line.productName,
        productType: line.productType,
        collectionSlug: line.collectionSlug,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        currency: line.currency,
        lineNet: line.lineNet,
        lineCost: line.lineCost,
        feeAmount: line.feeAmount,
        platformFeeEur: line.platformFeeEur,
        isPromo: line.isPromo,
        status: line.status,
        source: line.source,
        createdAt: FieldValue.serverTimestamp(),
      });
      if (line.status === "pending" && line.feeAmount > 0) {
        tx.set(db.collection("users").doc(line.artistId), {
          pendingBalance: FieldValue.increment(line.feeAmount),
          totalEarned: FieldValue.increment(line.feeAmount),
        }, { merge: true });
      }
    });

    plan.alerts.forEach((alert, index) => {
      if (alertSnaps[index].exists) return;
      tx.set(alertRefs[index], {
        ...alert,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  });
}
