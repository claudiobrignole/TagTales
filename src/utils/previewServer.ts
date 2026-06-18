import { getApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { canViewContent, isPublished } from './previewAccess.ts';

type CollectionName = 'mostre' | 'scrittori' | 'articoli';

export function getAdminFirestore(databaseId: string): Firestore {
  return getFirestore(getApp(), databaseId);
}

async function resolveDocBySlug(db: Firestore, collectionName: CollectionName, slug: string) {
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

export async function fetchPublishedSlugs(
  db: Firestore,
  collectionName: CollectionName,
): Promise<Array<{ id: string; slug?: string; slug_en?: string }>> {
  const snap = await db.collection(collectionName).where('published', '==', true).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    slug: doc.data().slug as string | undefined,
    slug_en: doc.data().slug_en as string | undefined,
  }));
}
