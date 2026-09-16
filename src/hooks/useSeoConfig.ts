import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type SeoConfigDoc = {
  titleIT?: string;
  titleEN?: string;
  descriptionIT?: string;
  descriptionEN?: string;
  keywordsIT?: string[];
  keywordsEN?: string[];
  ogImageUrl?: string;
  ogImageAlt?: string;
};

/**
 * Loads Firestore `seoConfig/{pageId}` (same docs as Admin → SEO Manager).
 * Use pageId on listing/home pages so meta stays editable without code deploys.
 */
export function useSeoConfig(pageId?: string | null) {
  const [config, setConfig] = useState<SeoConfigDoc | null>(null);
  const [loading, setLoading] = useState(Boolean(pageId));

  useEffect(() => {
    if (!pageId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "seoConfig", pageId));
        if (!cancelled) {
          setConfig(snap.exists() ? (snap.data() as SeoConfigDoc) : null);
        }
      } catch (err) {
        console.warn("SEO config fetch failed:", pageId, err);
        if (!cancelled) setConfig(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return { config, loading };
}
