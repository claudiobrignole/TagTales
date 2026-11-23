import { artistFeeEur, classifyFourthwallProduct, roundMoney, type FourthwallProductKind } from "./fourthwallSplit.ts";

export type Money = { value?: number; currency?: string };

export type FourthwallOrderOffer = {
  id?: string;
  name?: string;
  variant?: {
    id?: string;
    quantity?: number;
    unitPrice?: Money;
    price?: Money;
    unitCost?: Money;
    cost?: Money;
    compareAtPrice?: Money | null;
    attributes?: { size?: { name?: string } | null };
    stock?: { type?: string };
  };
};

export type FourthwallOrder = {
  id: string;
  friendlyId?: string;
  status?: string;
  promotionId?: string | null;
  source?: { type?: string };
  amounts?: {
    subtotal?: Money;
    tax?: Money;
    discount?: Money;
  };
  offers?: FourthwallOrderOffer[];
};

export type IndexedProduct = {
  writerSlug?: string;
  unmappedSlug?: string;
  conflict?: boolean;
  name?: string;
  stockType?: string | null;
  unitCost?: number | null;
  sizeName?: string | null;
};

export type PlannedRoyalty = {
  royaltyId: string;
  artistId: string;
  orderId: string;
  friendlyId: string;
  productId: string;
  productName: string;
  productType: FourthwallProductKind | "conflict";
  collectionSlug: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineNet: number;
  lineCost: number;
  feeAmount: number;
  platformFeeEur: number | null;
  lineNetEur: number | null;
  fxRate: number | null;
  isPromo: boolean;
  status: "pending" | "needs_fx" | "unknown_product" | "conflict";
  source: "fourthwall";
};

export type PlannedAlert = {
  id: string;
  orderId: string;
  productId: string;
  collectionSlug: string;
  reason: "unmapped_collection" | "writer_conflict" | "writer_without_uid";
};

export type OrderPlan = {
  orderId: string;
  cancelled: boolean;
  ignoredReason?: string;
  lines: PlannedRoyalty[];
  alerts: PlannedAlert[];
};

function moneyValue(money: Money | null | undefined): number {
  const value = Number(money?.value);
  return Number.isFinite(value) ? value : 0;
}

function lineNet(order: FourthwallOrder, linePrice: number, currency: string): number {
  const subtotal = order.amounts?.subtotal;
  const sameCurrency =
    !subtotal?.currency || subtotal.currency.toUpperCase() === currency.toUpperCase();
  const base = moneyValue(subtotal);
  if (!sameCurrency || base <= 0) return roundMoney(linePrice);
  const share = linePrice / base;
  const tax = moneyValue(order.amounts?.tax) * share;
  const discount = moneyValue(order.amounts?.discount) * share;
  return roundMoney(Math.max(0, linePrice - tax - discount));
}

export function planFourthwallOrder(
  order: FourthwallOrder,
  products: Record<string, IndexedProduct>,
  writerUidBySlug: Record<string, string>,
  eurPerUnitByCurrency: Record<string, number> = {},
): OrderPlan {
  const orderId = order.id;
  const source = order.source?.type;
  if (source && source !== "ORDER") {
    return { orderId, cancelled: false, ignoredReason: source, lines: [], alerts: [] };
  }

  const cancelled = order.status === "CANCELLED";
  const lines: PlannedRoyalty[] = [];
  const alerts: PlannedAlert[] = [];

  for (const offer of order.offers || []) {
    const productId = offer.id || "";
    const variantId = offer.variant?.id || productId;
    const indexed = products[productId];
    if (!productId || !indexed) continue;

    if (indexed.conflict) {
      alerts.push({
        id: `${orderId}_${productId}`,
        orderId,
        productId,
        collectionSlug: indexed.writerSlug || "",
        reason: "writer_conflict",
      });
      continue;
    }

    if (!indexed.writerSlug) {
      if (indexed.unmappedSlug) {
        alerts.push({
          id: `${orderId}_${productId}`,
          orderId,
          productId,
          collectionSlug: indexed.unmappedSlug,
          reason: "unmapped_collection",
        });
      }
      continue;
    }

    const artistId = writerUidBySlug[indexed.writerSlug];
    if (!artistId) {
      alerts.push({
        id: `${orderId}_${productId}`,
        orderId,
        productId,
        collectionSlug: indexed.writerSlug,
        reason: "writer_without_uid",
      });
      continue;
    }

    const variant = offer.variant || {};
    const quantity = Number(variant.quantity || 0);
    const currency = (variant.price?.currency || variant.unitPrice?.currency || "USD").toUpperCase();
    const linePrice = moneyValue(variant.price) || roundMoney(moneyValue(variant.unitPrice) * quantity);
    const lineCost = moneyValue(variant.cost) || roundMoney(moneyValue(variant.unitCost) * quantity);
    const kind = classifyFourthwallProduct({
      name: offer.name || indexed.name,
      stockType: indexed.stockType,
      unitCost: indexed.unitCost,
      sizeName: variant.attributes?.size?.name || indexed.sizeName,
    });
    const promo = Boolean(order.promotionId) || Boolean(variant.compareAtPrice);
    const net = lineNet(order, linePrice, currency);
    const fee = artistFeeEur({
      kind,
      quantity,
      promo,
      currency,
      lineNet: net,
      eurPerUnit: eurPerUnitByCurrency[currency] ?? null,
    });

    lines.push({
      royaltyId: `fw_${orderId}_${variantId}`,
      artistId,
      orderId,
      friendlyId: order.friendlyId || "",
      productId,
      productName: offer.name || indexed.name || "",
      productType: kind,
      collectionSlug: indexed.writerSlug,
      quantity,
      unitPrice: quantity > 0 ? roundMoney(linePrice / quantity) : linePrice,
      currency,
      lineNet: net,
      lineNetEur: fee.lineNetEur,
      fxRate: fee.fxRate,
      lineCost,
      feeAmount: fee.feeAmount,
      platformFeeEur: fee.platformFeeEur,
      isPromo: promo,
      status: fee.status,
      source: "fourthwall",
    });
  }

  return { orderId, cancelled, lines, alerts };
}
