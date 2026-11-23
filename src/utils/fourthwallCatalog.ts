import { writerCollectionUrl, writerProductUrl } from "./fourthwallStore.ts";

const BASE = "https://api.fourthwall.com/open-api/v1.0";
const CACHE_MS = 5 * 60 * 1000;

export type PublicStoreProduct = {
  id: string;
  name: string;
  image: string;
  price: string;
  url: string;
};

type CacheEntry = { at: number; items: PublicStoreProduct[] };
const cache = new Map<string, CacheEntry>();

function authHeader(): string | null {
  const username = process.env.FOURTHWALL_API_USER || process.env.FOURTHWALL_API_USERNAME || "";
  const password = process.env.FOURTHWALL_API_PASSWORD || "";
  if (!username || !password) return null;
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

async function apiGet(pathname: string, auth: string): Promise<any> {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Fourthwall ${res.status} ${pathname}`);
  }
  return res.json();
}

function asList(body: any): any[] {
  if (Array.isArray(body)) return body;
  for (const key of ["results", "items", "products", "data", "content"]) {
    if (Array.isArray(body?.[key])) return body[key];
  }
  return [];
}

function imageOf(product: any): string {
  const candidates = [product?.thumbnailImage, product?.images?.[0], product?.image];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) return candidate;
    if (typeof candidate?.url === "string") return candidate.url;
    if (typeof candidate?.src === "string") return candidate.src;
  }
  return "";
}

function priceOf(product: any): string {
  const price = product?.variants?.[0]?.unitPrice || product?.price;
  const value = price?.value;
  if (value == null || value === "") return "";
  const currency = price?.currency || "USD";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export type ShopProductIndex = Record<string, {
  writerSlug?: string;
  unmappedSlug?: string;
  conflict?: boolean;
  name?: string;
  stockType?: string | null;
  unitCost?: number | null;
  sizeName?: string | null;
}>;

const EXCLUDED_COLLECTIONS = new Set(["all", "aelle-original", "tag-tales"]);
let indexCache: { at: number; writerKey: string; index: ShopProductIndex } | null = null;

async function collectionProductIds(collectionId: string, auth: string): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 0; page < 20; page++) {
    const body = await apiGet(
      `/collections/${encodeURIComponent(collectionId)}/products?page=${page}&size=100`,
      auth,
    );
    if (!body) break;
    const batch = asList(body);
    for (const row of batch) {
      if (row?.id) ids.push(String(row.id));
    }
    if (batch.length < 100) break;
  }
  return ids;
}

/** Product id → writer collection, or a non-writer collection that still needs a human. */
export async function indexShopProducts(writerSlugs: string[]): Promise<ShopProductIndex> {
  const writerKey = [...writerSlugs].map((s) => s.trim().toLowerCase()).filter(Boolean).sort().join(",");
  if (indexCache && indexCache.writerKey === writerKey && Date.now() - indexCache.at < CACHE_MS) {
    return indexCache.index;
  }
  const auth = authHeader();
  if (!auth) throw new Error("Fourthwall credentials not configured");

  const writers = new Set(writerKey ? writerKey.split(",") : []);
  const index: ShopProductIndex = {};
  const collections: any[] = [];
  for (let page = 0; page < 10; page++) {
    const body = await apiGet(`/collections?page=${page}&size=100`, auth);
    const batch = asList(body);
    collections.push(...batch);
    if (batch.length < 100) break;
  }

  for (const collection of collections) {
    const slug = String(collection.slug || "").trim().toLowerCase();
    const id = String(collection.id || slug);
    if (!slug || EXCLUDED_COLLECTIONS.has(slug)) continue;
    const productIds = await collectionProductIds(id, auth);
    const isWriter = writers.has(slug);
    for (const productId of productIds) {
      const current = index[productId] || {};
      if (isWriter) {
        if (current.writerSlug && current.writerSlug !== slug) {
          index[productId] = { ...current, writerSlug: slug, conflict: true };
        } else {
          index[productId] = { ...current, writerSlug: slug, unmappedSlug: undefined, conflict: false };
        }
      } else if (!current.writerSlug) {
        index[productId] = { ...current, unmappedSlug: slug };
      }
    }
  }

  indexCache = { at: Date.now(), writerKey, index };
  return index;
}

export async function loadProductFacts(productId: string): Promise<{
  name?: string;
  stockType?: string | null;
  unitCost?: number | null;
  sizeName?: string | null;
}> {
  const auth = authHeader();
  if (!auth) throw new Error("Fourthwall credentials not configured");
  const product = await apiGet(`/products/${encodeURIComponent(productId)}`, auth);
  const variant = product?.variants?.[0] || {};
  const cost = variant.unitCost?.value;
  return {
    name: product?.name,
    stockType: variant.stock?.type ?? null,
    unitCost: cost == null ? null : Number(cost),
    sizeName: variant.attributes?.size?.name ?? null,
  };
}

export async function fetchFourthwallOrder(orderId: string): Promise<any> {
  const auth = authHeader();
  if (!auth) throw new Error("Fourthwall credentials not configured");
  const order = await apiGet(`/order/${encodeURIComponent(orderId)}`, auth);
  if (!order) throw new Error(`Fourthwall order not found: ${orderId}`);
  return order;
}

export async function listWriterCollectionProducts(slug: string): Promise<PublicStoreProduct[]> {
  const collectionUrl = writerCollectionUrl(slug);
  if (!collectionUrl) return [];

  const key = collectionUrl;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;

  const auth = authHeader();
  if (!auth) throw new Error("Fourthwall credentials not configured");

  const clean = (slug || "").trim().toLowerCase();
  const collection = await apiGet(`/collections/${encodeURIComponent(clean)}`, auth);
  const collectionId = String(collection?.id || clean);
  const summaries: any[] = [];
  for (let page = 0; page < 20; page++) {
    const body = await apiGet(
      `/collections/${encodeURIComponent(collectionId)}/products?page=${page}&size=100`,
      auth,
    );
    if (!body) break;
    const batch = asList(body);
    summaries.push(...batch);
    if (batch.length < 100) break;
  }

  const items: PublicStoreProduct[] = [];
  for (const summary of summaries) {
    const id = String(summary?.id || "");
    if (!id) continue;
    const product = (await apiGet(`/products/${encodeURIComponent(id)}`, auth)) || summary;
    const productUrl = writerProductUrl(product.slug) || collectionUrl;
    items.push({
      id,
      name: String(product.name || summary.name || ""),
      image: imageOf(product),
      price: priceOf(product),
      url: productUrl,
    });
  }

  cache.set(key, { at: Date.now(), items });
  return items;
}
