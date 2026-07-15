export type EcwidStoreLink = {
  url: string;
  label?: string;
  label_en?: string;
};

export const ECWID_LINKS_MAX = 4;

/** Non-empty links for the public UI (legacy `ecwidLink` included). */
export function normalizeEcwidLinks(img: {
  ecwidLink?: string;
  ecwidLinks?: EcwidStoreLink[];
}): EcwidStoreLink[] {
  if (Array.isArray(img.ecwidLinks)) {
    const fromArray = img.ecwidLinks
      .map((l) => ({
        url: (l?.url || '').trim(),
        label: l?.label?.trim() || undefined,
        label_en: l?.label_en?.trim() || undefined,
      }))
      .filter((l) => l.url);
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

/** Exactly 4 slots for the admin form (legacy `ecwidLink` → slot 0). */
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
      label: entry?.label || '',
      label_en: entry?.label_en || '',
    });
  }
  return slots;
}

/** Persist up to 4 slots; sync legacy `ecwidLink` to the first filled URL. */
export function buildEcwidLinkUpdates(slots: EcwidStoreLink[]): {
  ecwidLinks: EcwidStoreLink[];
  ecwidLink: string;
} {
  const normalized = slots.slice(0, ECWID_LINKS_MAX).map((s) => ({
    url: (s.url || '').trim(),
    label: (s.label || '').trim() || undefined,
    label_en: (s.label_en || '').trim() || undefined,
  }));
  const firstUrl = normalized.find((s) => s.url)?.url || '';
  return {
    ecwidLinks: normalized,
    ecwidLink: firstUrl,
  };
}
