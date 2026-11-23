import type { Firestore } from "firebase-admin/firestore";
import { fetchFourthwallOrder, indexShopProducts, loadProductFacts } from "./fourthwallCatalog.ts";
import { applyFourthwallPlan } from "./fourthwallApply.ts";
import { planFourthwallOrder, type FourthwallOrder } from "./fourthwallOrderPlan.ts";
import { eurRatesFor } from "./fourthwallFx.ts";
import type { ShopProductIndex } from "./fourthwallCatalog.ts";

export async function ingestFourthwallEvent(db: Firestore, event: {
  type?: string;
  testMode?: boolean;
  data?: { id?: string; orderId?: string } | string;
}): Promise<{ ignored?: string; orderId?: string; lines?: number; alerts?: number }> {
  if (event.testMode) return { ignored: "test" };
  if (event.type !== "ORDER_PLACED" && event.type !== "ORDER_UPDATED") {
    return { ignored: event.type || "unknown" };
  }

  const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  const orderId = data?.id || data?.orderId;
  if (!orderId) return { ignored: "no-order" };

  const order = (await fetchFourthwallOrder(orderId)) as FourthwallOrder;
  const writers = await db.collection("scrittori").get();
  const writerUidBySlug: Record<string, string> = {};
  const slugs: string[] = [];
  writers.forEach((doc) => {
    const slug = String(doc.data().slug || "").trim().toLowerCase();
    const uid = doc.data().uid;
    if (!slug || !uid) return;
    writerUidBySlug[slug] = String(uid);
    slugs.push(slug);
  });

  const cached = await indexShopProducts(slugs);
  const index: ShopProductIndex = { ...cached };
  for (const offer of order.offers || []) {
    const productId = offer.id;
    if (!productId || !index[productId]) continue;
    const facts = await loadProductFacts(productId);
    index[productId] = { ...index[productId], ...facts };
  }

  const currencies = (order.offers || []).map((offer) =>
    String(offer.variant?.price?.currency || offer.variant?.unitPrice?.currency || "USD"),
  );
  const eurPerUnitByCurrency = await eurRatesFor(currencies);
  const plan = planFourthwallOrder(order, index, writerUidBySlug, eurPerUnitByCurrency);
  await applyFourthwallPlan(db, plan);
  return { orderId, lines: plan.lines.length, alerts: plan.alerts.length };
}
