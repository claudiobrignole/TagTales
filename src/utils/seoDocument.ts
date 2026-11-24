/**
 * Shared SEO document: canonical URLs (no trailing slash), hreflang,
 * titles, JSON-LD and the HTML snapshot injected before React boots.
 */

export const CANONICAL_ORIGIN = "https://tagtalesgallery.com";

export const GALLERY = {
  name: "Tag Tales Gallery",
  streetAddress: "Via Monte Carmen 10",
  postalCode: "6900",
  addressLocality: "Lugano",
  addressRegion: "Ticino",
  addressCountry: "CH",
  /** No public timetable is published. Visits are by appointment. */
  visitNoteIt: "Visite su appuntamento",
  visitNoteEn: "Visits by appointment",
  email: "tagtales@brignole.ch",
  sameAs: [
    "https://www.instagram.com/tagtales.gallery/",
    "https://aelle.hiphop",
    "https://brignole.ch",
    "https://www.youtube.com/@aellehiphopmagazine",
  ],
} as const;

export const HOME_TITLE = {
  it: "Tag Tales – Galleria di street art a Lugano",
  en: "Tag Tales – Street art gallery in Lugano",
} as const;

export type SeoLang = "it" | "en";

export type SeoLink = { href: string; text: string };

export type SeoCatalogItem = {
  id: string;
  slug: string;
  slugEn: string;
  titleIt: string;
  titleEn: string;
  introIt: string;
  introEn: string;
  artist: string;
  city: string;
  start: string;
  end: string;
  author: string;
  lastmod?: string;
  featured: boolean;
};

export type SeoPageItem = {
  id: string;
  titleIt: string;
  titleEn: string;
  lastmod?: string;
};

export type SeoCatalog = {
  exhibitions: SeoCatalogItem[];
  writers: SeoCatalogItem[];
  articles: SeoCatalogItem[];
  pages: SeoPageItem[];
};

export const EMPTY_CATALOG: SeoCatalog = {
  exhibitions: [],
  writers: [],
  articles: [],
  pages: [],
};

/** Pages that duplicate a dedicated route and are redirected. */
export const SITEMAP_PAGE_SKIP = new Set(["home", "su-di-noi"]);

const STATIC_PAIRS: Array<[string, string]> = [
  ["/", "/en"],
  ["/writers", "/en/writers"],
  ["/exhibitions", "/en/exhibitions"],
  ["/magazine", "/en/magazine"],
  ["/assistenza", "/en/support"],
  ["/su-di-noi", "/en/about"],
];

/** 301 targets. Keys are paths without a trailing slash. */
export const PUBLIC_REDIRECTS: Record<string, string> = {
  "/en/assistenza": "/en/support",
  "/en/su-di-noi": "/en/about",
  "/support": "/assistenza",
  "/about": "/su-di-noi",
  "/en/about-us": "/en/about",
  "/info/home": "/",
  "/en/info/home": "/en",
  "/info/su-di-noi": "/su-di-noi",
  "/en/info/su-di-noi": "/en/about",
  "/en/info/terms-and-conditions": "/en/info/terms",
  "/magazine/european-graffiti-evolution": "/magazine",
  "/en/magazine/european-graffiti-evolution": "/en/magazine",
  "/magazine/digital-art-vs-traditional-spray": "/magazine",
  "/en/magazine/digital-art-vs-traditional-spray": "/en/magazine",
  "/magazine/birth-of-nyc-style-writing": "/magazine",
  "/en/magazine/birth-of-nyc-style-writing": "/en/magazine",
  "/exhibitions/urban-echoes": "/exhibitions",
  "/en/exhibitions/urban-echoes": "/en/exhibitions",
  "/exhibitions/train-canvas": "/exhibitions",
  "/en/exhibitions/train-canvas": "/en/exhibitions",
  "/exhibitions/colors-of-the-street": "/exhibitions",
  "/en/exhibitions/colors-of-the-street": "/en/exhibitions",
  "/exhibitions/style-masters": "/exhibitions",
  "/en/exhibitions/style-masters": "/en/exhibitions",
  "/exhibitions/global-voices": "/exhibitions",
  "/en/exhibitions/global-voices": "/en/exhibitions",
  "/exhibitions/characters-in-focus": "/exhibitions",
  "/en/exhibitions/characters-in-focus": "/en/exhibitions",
  "/writers/futura-2000": "/writers",
  "/en/writers/futura-2000": "/en/writers",
  "/writers/lady-pink": "/writers",
  "/en/writers/lady-pink": "/en/writers",
  "/writers/dondi-white": "/writers",
  "/en/writers/dondi-white": "/en/writers",
  "/writers/phase-2": "/writers",
  "/en/writers/phase-2": "/en/writers",
  "/writers/mode-2": "/writers",
  "/en/writers/mode-2": "/en/writers",
};

export function normalizePath(pathname: string): string {
  const raw = (pathname || "/").split("?")[0].split("#")[0] || "/";
  if (raw.length > 1 && raw.endsWith("/")) return raw.replace(/\/+$/, "") || "/";
  return raw || "/";
}

export function isEnglishPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/en" || path.startsWith("/en/");
}

export function langFromPath(pathname: string): SeoLang {
  return isEnglishPath(pathname) ? "en" : "it";
}

export function canonicalUrl(pathname: string): string {
  const path = normalizePath(pathname);
  if (path === "/") return CANONICAL_ORIGIN;
  return `${CANONICAL_ORIGIN}${path}`;
}

export function resolvePublicRedirect(pathname: string): string | null {
  const path = normalizePath(pathname);
  return PUBLIC_REDIRECTS[path] || null;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function plainText(value: string | undefined | null): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep descriptions near the length Google shows in search results. */
export function clampDescription(value: string, max = 155): string {
  const clean = plainText(value);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > 90 ? cut.slice(0, space) : cut).replace(/[.,;:–\-]+$/g, "");
  return `${base}…`;
}

export function hreflangPair(
  pathname: string,
  slugs?: { it?: string; en?: string },
): { it: string; en: string } | null {
  const path = normalizePath(pathname);

  for (const [itPath, enPath] of STATIC_PAIRS) {
    if (path === itPath || path === enPath) {
      return { it: canonicalUrl(itPath), en: canonicalUrl(enPath) };
    }
  }

  const info = path.match(/^\/(?:en\/)?info\/([^/]+)$/);
  if (info) {
    const id = info[1];
    return {
      it: canonicalUrl(`/info/${id}`),
      en: canonicalUrl(`/en/info/${id}`),
    };
  }

  const detail = path.match(/^\/(?:en\/)?(exhibitions|writers|magazine)\/([^/]+)$/);
  if (detail) {
    const section = detail[1];
    const current = detail[2];
    const itSlug = slugs?.it || current;
    const enSlug = slugs?.en || itSlug;
    return {
      it: canonicalUrl(`/${section}/${itSlug}`),
      en: canonicalUrl(`/en/${section}/${enSlug}`),
    };
  }

  return null;
}

function formatDay(lang: SeoLang, iso?: string): string | undefined {
  if (!iso?.trim()) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(lang === "en" ? "en-GB" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateRange(lang: SeoLang, start?: string, end?: string): string {
  const from = formatDay(lang, start);
  const to = formatDay(lang, end);
  if (from && to) return lang === "en" ? `${from} – ${to}` : `${from} – ${to}`;
  return from || to || "";
}

export function homeDescription(
  lang: SeoLang,
  show?: { title?: string; artist?: string },
): string {
  const title = show?.title?.trim();
  const artist = show?.artist?.trim();
  if (lang === "en") {
    if (title) {
      const by = artist ? ` by ${artist}` : "";
      return clampDescription(
        `Tag Tales is the street art gallery in Lugano. Now showing ${title}${by}: writers, original works and stories from the magazine. Visits by appointment.`,
        168,
      );
    }
    return clampDescription(
      "Tag Tales is the street art gallery in Lugano. Exhibitions, writers, original works and the magazine.",
    );
  }
  if (title) {
    const by = artist ? ` di ${artist}` : "";
      return clampDescription(
        `Tag Tales è la galleria di street art a Lugano. Ora in mostra ${title}${by}: writers, opere originali e storie dal magazine. Visite su appuntamento.`,
        168,
      );
  }
  return clampDescription(
    "Tag Tales è la galleria di street art a Lugano. Mostre, writers, opere originali e il magazine.",
  );
}

export function exhibitionMeta(
  lang: SeoLang,
  item: {
    title: string;
    artist?: string;
    city?: string;
    start?: string;
    end?: string;
    intro?: string;
  },
): { title: string; description: string } {
  const name = item.title.trim() || (lang === "en" ? "Exhibition" : "Mostra");
  const city = item.city?.trim() || "Lugano";
  const artist = item.artist?.trim();
  const when = dateRange(lang, item.start, item.end);
  const title =
    lang === "en"
      ? `${name} – Street art exhibition${artist ? ` by ${artist}` : ""} in ${city}${when ? `, ${when}` : ""} | Tag Tales`
      : `${name} – Mostra${artist ? ` di ${artist}` : ""} a ${city}${when ? `, ${when}` : ""} | Tag Tales`;
  const intro = plainText(item.intro);
  const description =
    lang === "en"
      ? clampDescription(
          `${name}${artist ? ` by ${artist}` : ""}, street art exhibition in ${city}${when ? ` (${when})` : ""}. ${intro || "Tag Tales Gallery, Lugano."}`,
        )
      : clampDescription(
          `${name}${artist ? ` di ${artist}` : ""}, mostra di street art a ${city}${when ? ` (${when})` : ""}. ${intro || "Tag Tales Gallery, Lugano."}`,
        );
  return { title, description };
}

export function writerMeta(
  lang: SeoLang,
  item: { name: string; city?: string; country?: string; bio?: string },
): { title: string; description: string } {
  const name = item.name.trim() || "Writer";
  const place = [item.city, item.country].filter(Boolean).join(", ");
  const title =
    lang === "en"
      ? `${name} – Street art writer${place ? `, ${place}` : ""} | Tag Tales`
      : `${name} – Writer di street art${place ? `, ${place}` : ""} | Tag Tales`;
  const bio = plainText(item.bio);
  const description =
    lang === "en"
      ? clampDescription(
          `${name}${place ? `, ${place}` : ""}. ${bio || "Street art writer at Tag Tales Gallery in Lugano."}`,
        )
      : clampDescription(
          `${name}${place ? `, ${place}` : ""}. ${bio || "Writer di street art alla galleria Tag Tales di Lugano."}`,
        );
  return { title, description };
}

export function articleMeta(
  lang: SeoLang,
  item: { title: string; author?: string; excerpt?: string },
): { title: string; description: string } {
  const name = item.title.trim() || (lang === "en" ? "Article" : "Articolo");
  const author = item.author?.trim();
  const title =
    lang === "en"
      ? `${name}${author ? ` by ${author}` : ""} – Street art magazine | Tag Tales`
      : `${name}${author ? ` di ${author}` : ""} – Magazine di street art | Tag Tales`;
  const excerpt = plainText(item.excerpt);
  const description =
    lang === "en"
      ? clampDescription(
          `${name}${author ? ` by ${author}` : ""}. ${excerpt || "Story from the Tag Tales street art magazine."}`,
        )
      : clampDescription(
          `${name}${author ? ` di ${author}` : ""}. ${excerpt || "Articolo del magazine di street art Tag Tales."}`,
        );
  return { title, description };
}

export function galleryAddressJsonLd(): Record<string, unknown> {
  return {
    "@type": "PostalAddress",
    streetAddress: GALLERY.streetAddress,
    postalCode: GALLERY.postalCode,
    addressLocality: GALLERY.addressLocality,
    addressRegion: GALLERY.addressRegion,
    addressCountry: GALLERY.addressCountry,
  };
}

export function artGalleryJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ArtGallery",
    "@id": `${CANONICAL_ORIGIN}/#gallery`,
    name: GALLERY.name,
    url: CANONICAL_ORIGIN,
    image: `${CANONICAL_ORIGIN}/og-default.jpg`,
    logo: `${CANONICAL_ORIGIN}/pwa-512x512.png`,
    description: `Galleria di street art a Lugano. ${GALLERY.visitNoteIt}.`,
    email: GALLERY.email,
    address: galleryAddressJsonLd(),
    sameAs: [...GALLERY.sameAs],
  };
}

export function exhibitionJsonLd(input: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  start?: string;
  end?: string;
  performers?: Array<{ name: string; url: string }>;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    name: input.name,
    url: input.url,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: GALLERY.name,
      address: galleryAddressJsonLd(),
    },
    organizer: { "@id": `${CANONICAL_ORIGIN}/#gallery` },
  };
  if (input.description) data.description = input.description;
  if (input.image) data.image = input.image;
  if (input.start) data.startDate = input.start;
  if (input.end) data.endDate = input.end;
  if (input.performers && input.performers.length > 0) {
    data.performer = input.performers.map((person) => ({
      "@type": "Person",
      name: person.name,
      url: person.url,
    }));
  }
  return data;
}

export function personJsonLd(input: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  sameAs?: string[];
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
  };
  if (input.description) data.description = input.description;
  if (input.image) data.image = input.image;
  if (input.sameAs && input.sameAs.length > 0) data.sameAs = input.sameAs;
  return data;
}

function linkList(links: SeoLink[]): string {
  if (links.length === 0) return "";
  const items = links
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a></li>`,
    )
    .join("");
  return `<ul>${items}</ul>`;
}

function snapshotMain(lang: SeoLang, h1: string, paragraph: string, links: SeoLink[]): string {
  const more = lang === "en" ? "On this site" : "Nel sito";
  return `<main><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(paragraph)}</p>${
    links.length ? `<nav aria-label="${escapeHtml(more)}">${linkList(links)}</nav>` : ""
  }</main>`;
}

function itemTitle(lang: SeoLang, item: SeoCatalogItem): string {
  return lang === "en" ? item.titleEn || item.titleIt : item.titleIt || item.titleEn;
}

function detailPath(section: "exhibitions" | "writers" | "magazine", lang: SeoLang, item: SeoCatalogItem): string {
  const slug = lang === "en" ? item.slugEn || item.slug : item.slug;
  return lang === "en" ? `/en/${section}/${slug}` : `/${section}/${slug}`;
}

function findBySlug(items: SeoCatalogItem[], slug: string): SeoCatalogItem | undefined {
  return items.find((item) => item.slug === slug || item.slugEn === slug || item.id === slug);
}

export type PublicSeo = {
  htmlLang: SeoLang;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  hreflang: { it: string; en: string } | null;
  robots: string;
  jsonLd: Record<string, unknown>[];
  snapshot: string;
  ogImage: string;
  ogImageAlt: string;
  status: 200 | 404;
};

export function composePublicSeo(input: {
  pathname: string;
  catalog?: SeoCatalog;
  notFound?: boolean;
  keywords?: string;
  ogImage?: string;
  ogImageAlt?: string;
  listingTitle?: string;
  listingDescription?: string;
}): PublicSeo {
  const path = normalizePath(input.pathname);
  const lang = langFromPath(path);
  const catalog = input.catalog || EMPTY_CATALOG;
  const featured =
    catalog.exhibitions.find((item) => item.featured) || catalog.exhibitions[0];

  const baseLinks: SeoLink[] = [
    { href: lang === "en" ? "/en" : "/", text: lang === "en" ? "Home" : "Home" },
    {
      href: lang === "en" ? "/en/exhibitions" : "/exhibitions",
      text: lang === "en" ? "Exhibitions" : "Mostre",
    },
    {
      href: lang === "en" ? "/en/writers" : "/writers",
      text: "Writers",
    },
    {
      href: lang === "en" ? "/en/magazine" : "/magazine",
      text: "Magazine",
    },
  ];

  const defaultOg = `${CANONICAL_ORIGIN}/og-default.jpg`;
  let title: string = lang === "en" ? HOME_TITLE.en : HOME_TITLE.it;
  let description = homeDescription(
    lang,
    featured
      ? { title: itemTitle(lang, featured), artist: featured.artist }
      : undefined,
  );
  let jsonLd: Record<string, unknown>[] = [];
  let snapshot = snapshotMain(lang, title, description, baseLinks);
  const hreflang = hreflangPair(path);
  let robots = "index, follow, max-image-preview:large";
  let status: 200 | 404 = 200;

  if (input.notFound) {
    title = lang === "en" ? "Page not found | Tag Tales" : "Pagina non trovata | Tag Tales";
    description =
      lang === "en"
        ? "This page does not exist on Tag Tales, the street art gallery in Lugano."
        : "Questa pagina non esiste su Tag Tales, galleria di street art a Lugano.";
    robots = "noindex, nofollow";
    status = 404;
    snapshot = snapshotMain(lang, lang === "en" ? "Page not found" : "Pagina non trovata", description, baseLinks);
    return {
      htmlLang: lang,
      title,
      description,
      keywords: input.keywords || "",
      canonical: canonicalUrl(path),
      hreflang: null,
      robots,
      jsonLd: [],
      snapshot,
      ogImage: input.ogImage || defaultOg,
      ogImageAlt: input.ogImageAlt || GALLERY.name,
      status,
    };
  }

  if (path === "/" || path === "/en") {
    jsonLd = [artGalleryJsonLd()];
    const showLinks = catalog.exhibitions.map((item) => ({
      href: detailPath("exhibitions", lang, item),
      text: itemTitle(lang, item),
    }));
    snapshot = snapshotMain(lang, title, description, [...baseLinks, ...showLinks]);
  } else if (path === "/exhibitions" || path === "/en/exhibitions") {
    title = input.listingTitle || (lang === "en" ? "Street art exhibitions in Lugano | Tag Tales" : "Mostre di street art a Lugano | Tag Tales");
    description =
      input.listingDescription ||
      (lang === "en"
        ? "Exhibitions at Tag Tales, the street art gallery in Lugano."
        : "Mostre di Tag Tales, galleria di street art a Lugano.");
    const links = catalog.exhibitions.map((item) => ({
      href: detailPath("exhibitions", lang, item),
      text: itemTitle(lang, item),
    }));
    snapshot = snapshotMain(lang, lang === "en" ? "Exhibitions" : "Mostre", description, links);
  } else if (path === "/writers" || path === "/en/writers") {
    title = input.listingTitle || (lang === "en" ? "Street art writers | Tag Tales" : "Writers di street art | Tag Tales");
    description =
      input.listingDescription ||
      (lang === "en"
        ? "Writers exhibiting at Tag Tales, the street art gallery in Lugano."
        : "Writers in mostra da Tag Tales, galleria di street art a Lugano.");
    const links = catalog.writers.map((item) => ({
      href: detailPath("writers", lang, item),
      text: itemTitle(lang, item),
    }));
    snapshot = snapshotMain(lang, "Writers", description, links);
  } else if (path === "/magazine" || path === "/en/magazine") {
    title = input.listingTitle || (lang === "en" ? "Street art magazine | Tag Tales" : "Magazine di street art | Tag Tales");
    description =
      input.listingDescription ||
      (lang === "en"
        ? "Stories and interviews from the Tag Tales street art magazine."
        : "Storie e interviste dal magazine di street art Tag Tales.");
    const links = catalog.articles.map((item) => ({
      href: detailPath("magazine", lang, item),
      text: itemTitle(lang, item),
    }));
    snapshot = snapshotMain(lang, "Magazine", description, links);
  } else if (path === "/info/contatti" || path === "/en/info/contatti") {
    title = lang === "en" ? "Contact Tag Tales, Lugano | Tag Tales" : "Contatti Tag Tales, Lugano | Tag Tales";
    description =
      lang === "en"
        ? `Contact Tag Tales at ${GALLERY.streetAddress}, ${GALLERY.postalCode} Lugano. ${GALLERY.visitNoteEn}.`
        : `Contatta Tag Tales in ${GALLERY.streetAddress}, ${GALLERY.postalCode} Lugano. ${GALLERY.visitNoteIt}.`;
    snapshot = snapshotMain(lang, lang === "en" ? "Contact" : "Contatti", description, [
      { href: `mailto:${GALLERY.email}`, text: GALLERY.email },
      { href: GALLERY.sameAs[0], text: "Instagram" },
      { href: lang === "en" ? "/en/support" : "/assistenza", text: lang === "en" ? "Support" : "Assistenza" },
    ]);
  } else {
    const exhibitionMatch = path.match(/^\/(?:en\/)?exhibitions\/([^/]+)$/);
    const writerMatch = path.match(/^\/(?:en\/)?writers\/([^/]+)$/);
    const articleMatch = path.match(/^\/(?:en\/)?magazine\/([^/]+)$/);

    if (exhibitionMatch) {
      const item = findBySlug(catalog.exhibitions, exhibitionMatch[1]);
      if (item) {
        const meta = exhibitionMeta(lang, {
          title: itemTitle(lang, item),
          artist: item.artist,
          city: item.city || "Lugano",
          start: item.start,
          end: item.end,
          intro: lang === "en" ? item.introEn || item.introIt : item.introIt || item.introEn,
        });
        title = meta.title;
        description = meta.description;
        const writer = catalog.writers.find(
          (person) => person.titleIt === item.artist || person.titleEn === item.artist,
        );
        const performers = item.artist
          ? [
              {
                name: item.artist,
                url: writer
                  ? canonicalUrl(detailPath("writers", lang, writer))
                  : canonicalUrl(lang === "en" ? "/en/writers" : "/writers"),
              },
            ]
          : [];
        jsonLd = [
          exhibitionJsonLd({
            name: itemTitle(lang, item),
            description,
            url: canonicalUrl(path),
            start: item.start || undefined,
            end: item.end || undefined,
            performers,
          }),
        ];
        const other = catalog.exhibitions
          .filter((otherItem) => otherItem.id !== item.id)
          .map((otherItem) => ({
            href: detailPath("exhibitions", lang, otherItem),
            text: itemTitle(lang, otherItem),
          }));
        const artistLinks = writer
          ? [{ href: detailPath("writers", lang, writer), text: item.artist }]
          : [];
        snapshot = snapshotMain(lang, itemTitle(lang, item), description, [...artistLinks, ...other, ...baseLinks]);
      }
    } else if (writerMatch) {
      const item = findBySlug(catalog.writers, writerMatch[1]);
      if (item) {
        const meta = writerMeta(lang, {
          name: itemTitle(lang, item),
          city: item.city,
          bio: lang === "en" ? item.introEn || item.introIt : item.introIt || item.introEn,
        });
        title = meta.title;
        description = meta.description;
        jsonLd = [
          personJsonLd({
            name: itemTitle(lang, item),
            description,
            url: canonicalUrl(path),
          }),
        ];
        const shows = catalog.exhibitions
          .filter((show) => show.artist && show.artist === itemTitle("it", item))
          .map((show) => ({
            href: detailPath("exhibitions", lang, show),
            text: itemTitle(lang, show),
          }));
        snapshot = snapshotMain(lang, itemTitle(lang, item), description, [...shows, ...baseLinks]);
      }
    } else if (articleMatch) {
      const item = findBySlug(catalog.articles, articleMatch[1]);
      if (item) {
        const meta = articleMeta(lang, {
          title: itemTitle(lang, item),
          author: item.author,
          excerpt: lang === "en" ? item.introEn || item.introIt : item.introIt || item.introEn,
        });
        title = meta.title;
        description = meta.description;
        jsonLd = [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: itemTitle(lang, item),
            description,
            url: canonicalUrl(path),
            author: item.author ? { "@type": "Person", name: item.author } : undefined,
            inLanguage: lang,
          },
        ];
        snapshot = snapshotMain(lang, itemTitle(lang, item), description, baseLinks);
      }
    } else if (input.listingTitle || input.listingDescription) {
      title = input.listingTitle || title;
      description = input.listingDescription || description;
      snapshot = snapshotMain(lang, title, description, baseLinks);
    }
  }

  return {
    htmlLang: lang,
    title,
    description,
    keywords: input.keywords || "",
    canonical: canonicalUrl(path),
    hreflang,
    robots,
    jsonLd,
    snapshot,
    ogImage: input.ogImage || defaultOg,
    ogImageAlt: input.ogImageAlt || title,
    status,
  };
}

export function applySeoHtml(html: string, seo: PublicSeo): string {
  const hreflangTags = seo.hreflang
    ? `<link rel="alternate" hreflang="it" href="${escapeHtml(seo.hreflang.it)}">\n    <link rel="alternate" hreflang="en" href="${escapeHtml(seo.hreflang.en)}">\n    <link rel="alternate" hreflang="x-default" href="${escapeHtml(seo.hreflang.it)}">`
    : "";
  const titleTag = `<title>${escapeHtml(seo.title)}</title>\n    <meta property="og:title" content="${escapeHtml(seo.title)}">\n    <meta name="robots" content="${escapeHtml(seo.robots)}">\n    <link rel="canonical" href="${escapeHtml(seo.canonical)}">\n    ${hreflangTags}`;
  const descTag = seo.description
    ? `<meta name="description" content="${escapeHtml(seo.description)}">\n    <meta property="og:description" content="${escapeHtml(seo.description)}">`
    : "";
  const keyTag = seo.keywords
    ? `<meta name="keywords" content="${escapeHtml(seo.keywords)}">`
    : "";
  const ogImgTag = `<meta property="og:image" content="${escapeHtml(seo.ogImage)}">\n    <meta property="og:image:alt" content="${escapeHtml(seo.ogImageAlt)}">\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">\n    <meta property="og:url" content="${escapeHtml(seo.canonical)}">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:image" content="${escapeHtml(seo.ogImage)}">`;
  const jsonLdTags = seo.jsonLd
    .map(
      (entry) =>
        `<script type="application/ld+json">${JSON.stringify(entry).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n    ");

  return html
    .replace(/<html\s+lang="[^"]*"/, `<html lang="${seo.htmlLang}"`)
    .replace("<!--META_TITLE-->", titleTag)
    .replace("<!--META_DESCRIPTION-->", descTag)
    .replace("<!--META_KEYWORDS-->", keyTag)
    .replace("<!--META_OG_IMAGE-->", ogImgTag)
    .replace("<!--META_JSONLD-->", jsonLdTags)
    .replace("<!--SEO_SNAPSHOT-->", seo.snapshot);
}

export function sitemapLoc(pathname: string): string {
  return canonicalUrl(pathname);
}
