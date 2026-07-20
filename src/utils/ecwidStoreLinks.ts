export type EcwidStoreLink = {
  url: string;
  url_en?: string;
  label?: string;
  label_en?: string;
};

export const ECWID_LINKS_MAX = 2;

/** Non-empty links for the public UI (legacy `ecwidLink` included). */
export function normalizeEcwidLinks(img: {
  ecwidLink?: string;
  ecwidLinks?: EcwidStoreLink[];
}): EcwidStoreLink[] {
  if (Array.isArray(img.ecwidLinks)) {
    const fromArray = img.ecwidLinks
      .map((l) => ({
        url: (l?.url || '').trim(),
        url_en: (l?.url_en || '').trim() || undefined,
        label: l?.label?.trim() || undefined,
        label_en: l?.label_en?.trim() || undefined,
      }))
      .filter((l) => l.url || l.url_en)
      .slice(0, ECWID_LINKS_MAX);
    if (fromArray.length > 0) return fromArray;
  }
  const legacy = (img.ecwidLink || '').trim();
  return legacy ? [{ url: legacy }] : [];
}

export function hasEcwidLinks(img: {
  ecwidLink?: string;
  ecwidLinks?: EcwidStoreLink[];
}): boolean {
  return normalizeEcwidLinks(img).length > 0;
}

/** Exactly 2 slots for the admin form (legacy `ecwidLink` → slot 0). */
export function getEcwidLinkSlots(img: {
  ecwidLink?: string;
  ecwidLinks?: EcwidStoreLink[];
}): EcwidStoreLink[] {
  const source =
    Array.isArray(img.ecwidLinks) && img.ecwidLinks.length > 0
      ? img.ecwidLinks
      : img.ecwidLink
        ? [{ url: img.ecwidLink }]
        : [];

  const slots: EcwidStoreLink[] = [];
  for (let i = 0; i < ECWID_LINKS_MAX; i++) {
    const entry = source[i];
    slots.push({
      url: entry?.url || '',
      url_en: entry?.url_en || '',
      label: entry?.label || '',
      label_en: entry?.label_en || '',
    });
  }
  return slots;
}

/** Persist up to 2 slots; sync legacy `ecwidLink` to the first filled URL. */
export function buildEcwidLinkUpdates(slots: EcwidStoreLink[]): {
  ecwidLinks: EcwidStoreLink[];
  ecwidLink: string;
} {
  const normalized = slots.slice(0, ECWID_LINKS_MAX).map((s) => ({
    url: (s.url || '').trim(),
    url_en: (s.url_en || '').trim() || undefined,
    // Keep label text as typed (spaces allowed); trim only when rendering (normalizeEcwidLinks)
    label: s.label || undefined,
    label_en: s.label_en || undefined,
  }));
  const firstUrl =
    normalized.find((s) => s.url)?.url ||
    normalized.find((s) => s.url_en)?.url_en ||
    '';
  return {
    ecwidLinks: normalized,
    ecwidLink: firstUrl,
  };
}
