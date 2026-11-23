/** Public Fourthwall shop. One collection per writer, slug = writer slug. */
export const FOURTHWALL_STORE_ORIGIN = "https://store.aelle.hiphop";

/** Shop collections that are not a writer. */
const NON_WRITER_COLLECTIONS = new Set(["all", "aelle-original", "tag-tales"]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function writerCollectionUrl(slug: string | null | undefined): string | null {
  const clean = (slug || "").trim().toLowerCase();
  if (!SLUG_RE.test(clean) || NON_WRITER_COLLECTIONS.has(clean)) return null;
  return `${FOURTHWALL_STORE_ORIGIN}/collections/${clean}`;
}

export function writerProductUrl(productSlug: string | null | undefined): string | null {
  const clean = (productSlug || "").trim().toLowerCase();
  if (!SLUG_RE.test(clean)) return null;
  return `${FOURTHWALL_STORE_ORIGIN}/products/${clean}`;
}

/**
 * Exhibition photos open the writer collection, never a single product.
 * One writer on the show: that collection. Several writers: the slug stored on the photo.
 */
export function exhibitionCollectionHref(
  writerSlugs: string[],
  imageWriterSlug?: string | null,
): string | null {
  const explicit = (imageWriterSlug || "").trim();
  if (explicit) return writerCollectionUrl(explicit);
  const unique = [...new Set(writerSlugs.map((s) => s.trim()).filter(Boolean))];
  if (unique.length !== 1) return null;
  return writerCollectionUrl(unique[0]);
}
