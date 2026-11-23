/**
 * Fase 1 — scoperta catalogo Fourthwall (store.aelle.hiphop).
 *
 * Sola lettura. Elenca le collection, poi per uno slug (default: shaone)
 * scarica i prodotti e il dettaglio di ciascuno, per vedere come lo shop
 * distingue una stampa limited edition da un POD.
 *
 * Uso:
 *   npx tsx scripts/fourthwall-discover.ts
 *   npx tsx scripts/fourthwall-discover.ts --slug shaone
 *   npx tsx scripts/fourthwall-discover.ts --slug shaone --max 5
 *
 * Credenziali in .env (mai in codice):
 *   FOURTHWALL_API_USER
 *   FOURTHWALL_API_PASSWORD
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const BASE = "https://api.fourthwall.com/open-api/v1.0";

type Json = Record<string, unknown>;

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function positional(): string | undefined {
  const flagsWithValue = new Set(["--slug", "--max"]);
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (flagsWithValue.has(args[i])) {
      i += 1;
      continue;
    }
    if (!args[i].startsWith("-")) return args[i];
  }
  return undefined;
}

const slug = argValue("--slug") ?? positional() ?? "shaone";
const maxProducts = Number(argValue("--max") ?? "0") || 0;

const username = process.env.FOURTHWALL_API_USER || process.env.FOURTHWALL_API_USERNAME || "";
const password = process.env.FOURTHWALL_API_PASSWORD || "";

if (!username || !password) {
  console.error(
    "Mancano FOURTHWALL_API_USER e FOURTHWALL_API_PASSWORD in .env.\n" +
      "Fourthwall → Settings → For Developers → Open API → Create API User.\n" +
      "Poi rilancia: npx tsx scripts/fourthwall-discover.ts --slug shaone",
  );
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

async function apiGet(pathname: string): Promise<unknown> {
  const url = pathname.startsWith("http") ? pathname : `${BASE}${pathname}`;
  const res = await fetch(url, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail = typeof body === "string" ? body.slice(0, 400) : JSON.stringify(body).slice(0, 400);
    throw new Error(`${res.status} ${res.statusText} ${pathname} — ${detail}`);
  }
  return body;
}

function asList(body: unknown): Json[] {
  if (Array.isArray(body)) return body.filter((x) => x && typeof x === "object") as Json[];
  if (!body || typeof body !== "object") return [];
  const obj = body as Json;
  for (const key of ["results", "items", "products", "collections", "data", "content"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.filter((x) => x && typeof x === "object") as Json[];
  }
  return [];
}

function pageInfo(body: unknown): { page: number; totalPages?: number; hasNext?: boolean } {
  if (!body || typeof body !== "object") return { page: 0 };
  const obj = body as Json;
  const page = Number(obj.page ?? obj.number ?? 0);
  const totalPages = obj.totalPages != null ? Number(obj.totalPages) : undefined;
  const hasNext =
    typeof obj.hasNext === "boolean"
      ? obj.hasNext
      : totalPages != null
        ? page + 1 < totalPages
        : undefined;
  return { page, totalPages, hasNext };
}

async function getAll(pathname: string): Promise<Json[]> {
  const out: Json[] = [];
  for (let page = 0; page < 50; page++) {
    const sep = pathname.includes("?") ? "&" : "?";
    const body = await apiGet(`${pathname}${sep}page=${page}&size=100`);
    const batch = asList(body);
    out.push(...batch);
    const info = pageInfo(body);
    if (batch.length === 0) break;
    if (info.hasNext === false) break;
    if (info.totalPages != null && page + 1 >= info.totalPages) break;
    if (batch.length < 100 && info.hasNext == null && info.totalPages == null) break;
  }
  return out;
}

function str(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function pickId(row: Json): string {
  return str(row.id) || str(row.productId) || str(row.offerId);
}

function money(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (typeof value === "object") {
    const obj = value as Json;
    const amount = obj.value ?? obj.amount ?? obj.amountInCents;
    const currency = obj.currency ?? obj.currencyCode ?? "";
    if (amount != null) return `${amount}${currency ? " " + currency : ""}`;
  }
  return "";
}

function variantSummary(product: Json): string {
  const variants = product.variants;
  if (!Array.isArray(variants)) return "";
  const skus = variants
    .slice(0, 4)
    .map((v) => (v && typeof v === "object" ? str((v as Json).sku) : ""))
    .filter(Boolean);
  const extra = variants.length > skus.length ? ` +${variants.length - skus.length}` : "";
  return `${variants.length}${skus.length ? " [" + skus.join(", ") + extra + "]" : ""}`;
}

function interesting(product: Json): Json {
  const keys = [
    "id",
    "name",
    "slug",
    "type",
    "status",
    "state",
    "productTemplateId",
    "profitMargin",
    "manufacturingService",
    "fulfillmentService",
    "fulfillmentType",
    "kind",
    "offerType",
    "category",
    "productType",
  ];
  const out: Json = {};
  for (const key of keys) {
    if (product[key] !== undefined) out[key] = product[key];
  }
  const price = product.price ?? product.unitPrice ?? product.basePrice;
  if (price !== undefined) out.price = price;
  if (Array.isArray(product.variants)) {
    out.variantCount = product.variants.length;
    out.variantSample = (product.variants as Json[]).slice(0, 2).map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price ?? v.unitPrice,
      attributes: v.attributes,
    }));
  }
  if (Array.isArray(product.collections)) out.collections = product.collections;
  if (Array.isArray(product.collectionIds)) out.collectionIds = product.collectionIds;
  out._topLevelKeys = Object.keys(product).sort();
  return out;
}

function label(row: Json): string {
  return str(row.name) || str(row.title) || str(row.slug) || pickId(row);
}

async function main() {
  console.log("Fourthwall — elenco collection\n");
  const collections = await getAll("/collections");
  if (collections.length === 0) {
    console.log("Nessuna collection. Risposta vuota o forma inattesa.");
  }
  for (const c of collections) {
    console.log(`- ${label(c)}  slug=${str(c.slug) || "—"}  id=${pickId(c) || "—"}  state=${str(c.state) || str(c.status) || "—"}`);
  }

  const match = collections.find((c) => str(c.slug) === slug || pickId(c) === slug || label(c).toLowerCase() === slug.toLowerCase());
  const collectionKey = match ? pickId(match) || str(match.slug) || slug : slug;
  console.log(`\nDettaglio collection "${slug}" (chiave API: ${collectionKey})\n`);

  let products = await getAll(`/collections/${encodeURIComponent(collectionKey)}/products`);
  if (products.length === 0 && collectionKey !== slug) {
    products = await getAll(`/collections/${encodeURIComponent(slug)}/products`);
  }
  console.log(`Prodotti in collection: ${products.length}`);
  if (maxProducts > 0 && products.length > maxProducts) {
    console.log(`Limite --max ${maxProducts}: dettaglio solo sui primi ${maxProducts}.`);
    products = products.slice(0, maxProducts);
  }

  const types = new Map<string, number>();
  const withTemplate: string[] = [];
  const withoutTemplate: string[] = [];

  for (const summary of products) {
    const id = pickId(summary);
    if (!id) {
      console.log("\nProdotto senza id, chiavi:", Object.keys(summary).join(", "));
      continue;
    }
    const detail = (await apiGet(`/products/${encodeURIComponent(id)}`)) as Json;
    const product = detail && typeof detail === "object" && !Array.isArray(detail) ? detail : summary;
    const type = str(product.type) || "(assente)";
    types.set(type, (types.get(type) ?? 0) + 1);
    const template = str(product.productTemplateId);
    (template ? withTemplate : withoutTemplate).push(`${label(product)} (${id})`);

    console.log("\n---");
    console.log(`${label(product)}`);
    console.log(`id: ${id}`);
    console.log(`type: ${type}`);
    console.log(`productTemplateId: ${template || "—"}`);
    console.log(`profitMargin: ${money(product.profitMargin) || str(product.profitMargin) || "—"}`);
    console.log(`status: ${str(product.status) || str(product.state) || "—"}`);
    console.log(`variants: ${variantSummary(product) || "—"}`);
    console.log(JSON.stringify(interesting(product), null, 2));
  }

  console.log("\n========== Riepilogo type ==========");
  if (types.size === 0) console.log("Nessun prodotto ispezionato.");
  for (const [type, count] of types) console.log(`${type}: ${count}`);
  console.log(`\nCon productTemplateId (candidato POD/design): ${withTemplate.length}`);
  for (const name of withTemplate) console.log(`  - ${name}`);
  console.log(`Senza productTemplateId: ${withoutTemplate.length}`);
  for (const name of withoutTemplate) console.log(`  - ${name}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("401") || message.startsWith("403")) {
    console.error("Autenticazione rifiutata. Controlla username e password dell'API User Fourthwall.");
  }
  console.error(message);
  process.exit(1);
});
