import { getApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { canViewContent, isExhibitionLinkedToWriter, isPublished } from './previewAccess.ts';
import type { SeoCatalog, SeoCatalogItem, SeoPageItem } from './seoDocument.ts';

type CollectionName = 'mostre' | 'scrittori' | 'articoli';

export function getAdminFirestore(databaseId: string): Firestore {
  return getFirestore(getApp(), databaseId);
}

export async function resolveDocBySlug(db: Firestore, collectionName: CollectionName, slug: string) {
  const col = db.collection(collectionName);

  const bySlug = await col.where('slug', '==', slug).limit(1).get();
  if (!bySlug.empty) {
    const doc = bySlug.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const bySlugEn = await col.where('slug_en', '==', slug).limit(1).get();
  if (!bySlugEn.empty) {
    const doc = bySlugEn.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const byId = await col.doc(slug).get();
  if (byId.exists) {
    return { id: byId.id, ...byId.data() };
  }

  return null;
}

/** Published entity for SEO meta injection / HTTP 404 checks. */
export async function fetchPublishedEntityForSeo(
  db: Firestore,
  collectionName: CollectionName,
  slug: string,
): Promise<Record<string, unknown> | null> {
  const doc = (await resolveDocBySlug(db, collectionName, slug)) as Record<string, unknown> | null;
  if (!doc || !isPublished(doc)) return null;
  return sanitizePreviewPayload(doc);
}

function sanitizePreviewPayload(data: Record<string, unknown>) {
  const { previewToken: _previewToken, ...rest } = data;
  return rest;
}

export async function fetchPreviewDocument(
  db: Firestore,
  collectionName: CollectionName,
  slug: string,
  token: string | undefined,
) {
  const doc = (await resolveDocBySlug(db, collectionName, slug)) as Record<string, unknown> | null;
  if (!doc) return null;

  if (isPublished(doc)) {
    return sanitizePreviewPayload(doc);
  }

  if (!canViewContent(doc, { previewToken: token ?? null, isAdmin: false })) {
    return null;
  }

  return sanitizePreviewPayload(doc);
}

/**
 * Related exhibitions for a writer preview page.
 * Requires a valid writer preview token so unpublished shows are never leaked publicly.
 */
export async function fetchWriterRelatedExhibitions(
  db: Firestore,
  writerSlug: string,
  token: string | undefined,
): Promise<{ items: Record<string, unknown>[] } | null> {
  const writer = (await resolveDocBySlug(db, 'scrittori', writerSlug)) as Record<string, unknown> | null;
  if (!writer) return null;

  const writerId = String(writer.id || '');
  // Require the writer's own preview token (not merely "can view published").
  if (!token || writer.previewToken !== token) {
    return null;
  }

  const snap = await db.collection('mostre').get();
  const items = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
    .filter((ex) => isExhibitionLinkedToWriter(ex, writerId))
    .map((ex) => {
      // Keep previewToken on unpublished shows so the writer page can deep-link into exhibition preview.
      if (isPublished(ex)) return sanitizePreviewPayload(ex);
      return ex;
    });

  return { items };
}

export async function fetchPublishedSlugs(
  db: Firestore,
  collectionName: CollectionName,
): Promise<Array<{ id: string; slug?: string; slug_en?: string; lastmod?: string }>> {
  const snap = await db.collection(collectionName).where('published', '==', true).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    const updated =
      data.updatedAt?.toDate?.() ||
      data.updatedAt ||
      data.publishedAt?.toDate?.() ||
      data.publishedAt ||
      doc.updateTime?.toDate?.() ||
      null;
    let lastmod: string | undefined;
    if (updated instanceof Date && !isNaN(updated.getTime())) {
      lastmod = updated.toISOString().split('T')[0];
    } else if (typeof updated === 'string' && updated.trim()) {
      const parsed = Date.parse(updated);
      if (!isNaN(parsed)) lastmod = new Date(parsed).toISOString().split('T')[0];
    }
    return {
      id: doc.id,
      slug: data.slug as string | undefined,
      slug_en: data.slug_en as string | undefined,
      lastmod,
    };
  });
}

function lastmodFrom(data: Record<string, unknown>, updateTime?: { toDate?: () => Date }): string | undefined {
  const updated =
    (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ||
    data.updatedAt ||
    (data.publishedAt as { toDate?: () => Date } | undefined)?.toDate?.() ||
    data.publishedAt ||
    updateTime?.toDate?.() ||
    null;
  if (updated instanceof Date && !isNaN(updated.getTime())) {
    return updated.toISOString().split('T')[0];
  }
  if (typeof updated === 'string' && updated.trim()) {
    const parsed = Date.parse(updated);
    if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
  }
  return undefined;
}

function textOf(value: unknown): string {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Published public records used by the sitemap and the HTML snapshot. */
export async function fetchSeoCatalog(db: Firestore): Promise<SeoCatalog> {
  const [writersSnap, exhibitionsSnap, articlesSnap, pagesSnap] = await Promise.all([
    db.collection('scrittori').where('published', '==', true).get(),
    db.collection('mostre').where('published', '==', true).get(),
    db.collection('articoli').where('published', '==', true).get(),
    db.collection('pagine').where('published', '==', true).get(),
  ]);

  const writers: SeoCatalogItem[] = writersSnap.docs.map((doc) => {
    const data = doc.data();
    const name = String(data.nickname || data.nomeDarte || data.artistName || 'Writer');
    return {
      id: doc.id,
      slug: String(data.slug || doc.id),
      slugEn: String(data.slug_en || data.slug || doc.id),
      titleIt: name,
      titleEn: String(data.nickname_en || name),
      introIt: textOf(data.bioBreve || data.bio).slice(0, 400),
      introEn: textOf(data.bioBreve_en || data.bio_en || data.bioBreve || data.bio).slice(0, 400),
      artist: name,
      city: String(data.citta || data.city || ''),
      start: '',
      end: '',
      author: '',
      lastmod: lastmodFrom(data, doc.updateTime),
      featured: false,
    };
  });

  const writerName = new Map(writers.map((writer) => [writer.id, writer.titleIt]));

  const exhibitions: SeoCatalogItem[] = exhibitionsSnap.docs.map((doc) => {
    const data = doc.data();
    const ids = [
      ...(Array.isArray(data.artistaIds) ? data.artistaIds : []),
      ...(Array.isArray(data.writerIds) ? data.writerIds : []),
      data.artistaPrincipaleId,
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    const artist =
      ids.map((id) => writerName.get(id)).filter(Boolean).join(', ') ||
      String(data.preTitolo || '');
    return {
      id: doc.id,
      slug: String(data.slug || doc.id),
      slugEn: String(data.slug_en || data.slug || doc.id),
      titleIt: String(data.titolo || data.title || 'Mostra'),
      titleEn: String(data.titolo_en || data.title_en || data.titolo || data.title || 'Exhibition'),
      introIt: textOf(data.intro || data.testoCuratela).slice(0, 400),
      introEn: textOf(data.intro_en || data.intro || data.testoCuratela).slice(0, 400),
      artist,
      city: String(data.citta || data.luogo || data.location || 'Lugano'),
      start: String(data.dataApertura || ''),
      end: String(data.dataChiusura || ''),
      author: '',
      lastmod: lastmodFrom(data, doc.updateTime),
      featured: data.featured === true || data.isFeatured === true,
    };
  });

  const articles: SeoCatalogItem[] = articlesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: String(data.slug || doc.id),
      slugEn: String(data.slug_en || data.slug || doc.id),
      titleIt: String(data.titolo || data.title || 'Articolo'),
      titleEn: String(data.titolo_en || data.title_en || data.titolo || data.title || 'Article'),
      introIt: textOf(data.estratto || data.sottotitolo || data.contenuto).slice(0, 400),
      introEn: textOf(data.estratto_en || data.sottotitolo_en || data.estratto || data.sottotitolo).slice(0, 400),
      artist: '',
      city: '',
      start: '',
      end: '',
      author: String(data.autore || data.author || ''),
      lastmod: lastmodFrom(data, doc.updateTime),
      featured: false,
    };
  });

  const pages: SeoPageItem[] = pagesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      titleIt: String(data.titolo || data.title || doc.id),
      titleEn: String(data.titolo_en || data.title_en || data.titolo || doc.id),
      lastmod: lastmodFrom(data, doc.updateTime),
    };
  });

  return { writers, exhibitions, articles, pages };
}
