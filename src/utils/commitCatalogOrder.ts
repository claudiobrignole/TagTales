import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import type { OrderPatch } from "./catalogSort";

const BATCH_LIMIT = 400;

export async function commitCatalogOrder(collectionName: string, patches: OrderPatch[]) {
  for (let start = 0; start < patches.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const patch of patches.slice(start, start + BATCH_LIMIT)) {
      batch.update(doc(db, collectionName, patch.id), {
        order: patch.order,
        manualOrder: patch.manualOrder,
      });
    }
    await batch.commit();
  }
}
