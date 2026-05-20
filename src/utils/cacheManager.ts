import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Fallback version
let currentCacheVersion = localStorage.getItem('tngt_cache_version') || '1.0.0';

// Simple in-memory pre-loaded images store to make them load instantly during session
const preloadedImagesMap = new Map<string, boolean>();

/**
 * Initializes and fetches the latest cache version from Firestore
 */
export async function initCacheVersion(): Promise<string> {
  try {
    const docRef = doc(db, 'settings', 'cache');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const dbVersion = snap.data().version || '1.0.0';
      if (dbVersion !== currentCacheVersion) {
        currentCacheVersion = dbVersion;
        localStorage.setItem('tngt_cache_version', dbVersion);
        // Clear in-memory preload map on version bump
        preloadedImagesMap.clear();
      }
    } else {
      // Create defaults
      await setDoc(docRef, { version: '1.0.0' });
    }
  } catch (err) {
    console.warn('[CacheManager] Failed to get cache version from Firestore, using local fallback:', err);
  }
  return currentCacheVersion;
}

/**
 * Gets the current synchronized cache version
 */
export function getCacheVersion(): string {
  return currentCacheVersion;
}

/**
 * Appends the cache version hash to an image URL to handle instant invalidation
 */
export function getBustedUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.endsWith('.svg') || url.trim() === '') return url;
  
  // Only apply to external URLs or paths with active storage/loading importance
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${currentCacheVersion}`;
}

/**
 * Triggers a global cache reset by updating the Firestore master settings
 */
export async function triggerGlobalCacheReset(): Promise<string> {
  const newVersion = `${Date.now()}`;
  try {
    const docRef = doc(db, 'settings', 'cache');
    await setDoc(docRef, { version: newVersion }, { merge: true });
    currentCacheVersion = newVersion;
    localStorage.setItem('tngt_cache_version', newVersion);
    preloadedImagesMap.clear();
    console.log('[CacheManager] Global Cache Invalidation Triggered successfully:', newVersion);
  } catch (err) {
    console.error('[CacheManager] Global Cache Invalidation failed:', err);
    throw err;
  }
  return newVersion;
}

/**
 * Checks if an image is already cached/preloaded in the current session
 */
export function isImagePreloaded(url: string): boolean {
  return preloadedImagesMap.has(url);
}

/**
 * Marks an image as preloaded in the current session
 */
export function markImagePreloaded(url: string): void {
  preloadedImagesMap.set(url, true);
}
