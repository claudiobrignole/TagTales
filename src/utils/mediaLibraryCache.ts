import { ref, listAll, getDownloadURL, type StorageReference } from "firebase/storage";
import { storage } from "../firebase";

export type MediaLibraryItem = {
  url: string;
  name: string;
  fullPath: string;
};

const TARGET_FOLDERS = [
  "uploads",
  "exhibition-blocks",
  "page-blocks",
  "profiles",
  "exhibitions",
  "opere",
  "writers",
  "articles",
] as const;

const CACHE_KEY = "ttg_media_library_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const URL_CONCURRENCY = 24;

type CachePayload = {
  fetchedAt: number;
  items: MediaLibraryItem[];
};

let memoryCache: CachePayload | null = null;
let inFlight: Promise<MediaLibraryItem[]> | null = null;

function readSessionCache(): CachePayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.fetchedAt || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: CachePayload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — memory cache still works
  }
}

export function invalidateMediaLibraryCache() {
  memoryCache = null;
  inFlight = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) || 1 }, async () => {
    while (index < items.length) {
      const current = items[index++];
      try {
        const value = await mapper(current);
        if (value) results.push(value);
      } catch {
        /* skip failed item */
      }
    }
  });

  await Promise.all(workers);
  return results;
}

async function collectFileRefs(folderPath: string): Promise<StorageReference[]> {
  const folderRef = ref(storage, folderPath);
  const refs: StorageReference[] = [];

  try {
    const res = await listAll(folderRef);
    refs.push(...res.items);
    const nested = await Promise.all(
      res.prefixes.map((prefix) => collectFileRefs(prefix.fullPath)),
    );
    for (const group of nested) refs.push(...group);
  } catch {
    /* folder missing or no permission */
  }

  return refs;
}

async function fetchAllMediaFromStorage(): Promise<MediaLibraryItem[]> {
  const folderResults = await Promise.all(
    TARGET_FOLDERS.map((folder) => collectFileRefs(folder)),
  );
  const allRefs = folderResults.flat();

  const items = await mapPool(allRefs, URL_CONCURRENCY, async (itemRef) => {
    const url = await getDownloadURL(itemRef);
    return {
      url,
      name: itemRef.name,
      fullPath: itemRef.fullPath,
    } satisfies MediaLibraryItem;
  });

  return items.sort((a, b) => b.fullPath.localeCompare(a.fullPath));
}

/**
 * Cached media library listing for admin picker / media page.
 * Memory + sessionStorage, parallel list + bounded concurrent getDownloadURL.
 */
export async function getMediaLibraryItems(options?: {
  forceRefresh?: boolean;
}): Promise<MediaLibraryItem[]> {
  if (!options?.forceRefresh) {
    if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
      return memoryCache.items;
    }
    const session = readSessionCache();
    if (session) {
      memoryCache = session;
      return session.items;
    }
  }

  if (inFlight && !options?.forceRefresh) {
    return inFlight;
  }

  inFlight = (async () => {
    const items = await fetchAllMediaFromStorage();
    const payload: CachePayload = { fetchedAt: Date.now(), items };
    memoryCache = payload;
    writeSessionCache(payload);
    return items;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function isVideoMediaUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}
