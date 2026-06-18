import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  canViewContent,
  getPreviewApiPath,
  isPublished,
  type PreviewContentType,
} from './previewAccess';

const COLLECTION_BY_TYPE: Record<PreviewContentType, string> = {
  exhibition: 'mostre',
  writer: 'scrittori',
  article: 'articoli',
};

async function resolveDocBySlug(collectionName: string, slug: string) {
  const qSlug = query(collection(db, collectionName), where('slug', '==', slug), limit(1));
  const qSlugEn = query(collection(db, collectionName), where('slug_en', '==', slug), limit(1));
  const [snap, snapEn] = await Promise.all([getDocs(qSlug), getDocs(qSlugEn)]);

  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  if (!snapEn.empty) return { id: snapEn.docs[0].id, ...snapEn.docs[0].data() };

  const idSnap = await getDoc(doc(db, collectionName, slug));
  if (idSnap.exists()) return { id: idSnap.id, ...idSnap.data() };

  return null;
}

export type FetchPreviewResult<T> = {
  data: T | null;
  isPreviewMode: boolean;
  accessDenied: boolean;
};

export async function fetchPreviewableContent<T extends Record<string, unknown>>(
  type: PreviewContentType,
  slug: string | undefined,
  options: { previewToken?: string | null; isAdmin?: boolean },
): Promise<FetchPreviewResult<T>> {
  if (!slug) {
    return { data: null, isPreviewMode: false, accessDenied: true };
  }

  const collectionName = COLLECTION_BY_TYPE[type];
  let data: T | null = null;

  try {
    data = (await resolveDocBySlug(collectionName, slug)) as unknown as T | null;
  } catch {
    data = null;
  }

  if (data && canViewContent(data, options)) {
    const isPreviewMode =
      !isPublished(data) &&
      !options.isAdmin &&
      Boolean(options.previewToken);
    return { data, isPreviewMode, accessDenied: false };
  }

  if (options.previewToken) {
    try {
      const res = await fetch(getPreviewApiPath(type, slug, options.previewToken));
      if (res.ok) {
        const payload = (await res.json()) as T;
        return {
          data: payload,
          isPreviewMode: !isPublished(payload),
          accessDenied: false,
        };
      }
    } catch {
      // fall through
    }
  }

  return { data: null, isPreviewMode: false, accessDenied: true };
}
