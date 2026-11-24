import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useSeoConfig } from "../hooks/useSeoConfig";
import {
  artGalleryJsonLd,
  canonicalUrl,
  CANONICAL_ORIGIN,
  hreflangPair,
  langFromPath,
} from "../utils/seoDocument";

export interface SEOProps {
  /** Page title without site suffix (suffix added automatically unless already present). */
  title?: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  article?: boolean;
  noIndex?: boolean;
  /**
   * Firestore seoConfig doc id (home | writers | exhibitions | magazine | …).
   * When set, Admin SEO Manager values override empty props for that language.
   */
  pageId?: string;
  /** Schema.org JSON-LD object or array of objects. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** When true, emit ArtGallery schema (home). */
  artGallery?: boolean;
  /** Absolute alternate URLs when the English slug differs from the Italian one. */
  alternateIt?: string;
  alternateEn?: string;
}

const SITE_NAME = "Tag Tales";
const SITE_NAME_LONG = "Tag Tales Gallery";
export { CANONICAL_ORIGIN };

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildTitle(raw?: string): string {
  if (!raw?.trim()) return SITE_NAME_LONG;
  const t = stripHtml(raw.trim());
  if (
    t.toLowerCase().includes("tag tales") ||
    t.toLowerCase().includes("tagtales")
  ) {
    return t;
  }
  return `${t} | ${SITE_NAME}`;
}

function normalizeKeywords(value?: string | string[]): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}

function toAbsoluteUrl(url: string | undefined, origin: string): string {
  if (!url?.trim()) return `${origin}/og-default.jpg`;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${origin}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  article,
  noIndex,
  pageId,
  jsonLd,
  artGallery,
  alternateIt,
  alternateEn,
}) => {
  const { t } = useTranslation();
  const { config } = useSeoConfig(pageId);
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const lang = langFromPath(pathname);

  const baseUrl = CANONICAL_ORIGIN;
  const defaultImage = `${baseUrl}/og-default.jpg`;
  const canonicalHref = canonicalUrl(pathname);
  const alternates = hreflangPair(pathname);
  const itUrl = alternateIt || alternates?.it || baseUrl;
  const enUrl = alternateEn || alternates?.en || `${baseUrl}/en`;

  const resolved = useMemo(() => {
    const cfgTitle =
      lang === "en" ? config?.titleEN : config?.titleIT;
    const cfgDesc =
      lang === "en" ? config?.descriptionEN : config?.descriptionIT;
    const cfgKeywords =
      lang === "en" ? config?.keywordsEN : config?.keywordsIT;

    const defaultDescription = t(
      "seo.defaultDescription",
      "Tag Tales Gallery — galleria internazionale di street art e graffiti. Scopri mostre, writers e opere originali: esplora e visita le esposizioni.",
    );

    const desc = stripHtml(
      description || cfgDesc || defaultDescription,
    ).slice(0, 320);

    const kw =
      normalizeKeywords(keywords) ||
      normalizeKeywords(cfgKeywords) ||
      t(
        "seo.defaultKeywords",
        "tag tales, graffiti, street art, writers, mostre, magazine, urban art",
      );

    return {
      title: buildTitle(title || cfgTitle),
      description: desc,
      keywords: kw,
      image: toAbsoluteUrl(image || config?.ogImageUrl || defaultImage, baseUrl),
      imageAlt: config?.ogImageAlt || SITE_NAME_LONG,
    };
  }, [config, description, image, keywords, lang, t, title, defaultImage, baseUrl]);

  const locale = lang === "en" ? "en_US" : "it_IT";
  const jsonLdPayload = useMemo(() => {
    const graph: Record<string, unknown>[] = artGallery
      ? [artGalleryJsonLd()]
      : [
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${baseUrl}/#gallery`,
            name: SITE_NAME_LONG,
            url: baseUrl,
            logo: `${baseUrl}/pwa-512x512.png`,
            image: `${baseUrl}/og-default.jpg`,
            sameAs: artGalleryJsonLd().sameAs,
          },
        ];

    if (jsonLd) {
      const extra = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      graph.push(...extra);
    }

    return graph;
  }, [baseUrl, jsonLd, artGallery]);

  return (
    <Helmet>
      <html lang={lang} />
      <title>{resolved.title}</title>
      <meta name="description" content={resolved.description} />
      {resolved.keywords && (
        <meta name="keywords" content={resolved.keywords} />
      )}
      <meta name="image" content={resolved.image} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {!noIndex && (
        <>
          <link rel="alternate" hrefLang="it" href={itUrl || baseUrl} />
          <link rel="alternate" hrefLang="en" href={enUrl} />
          <link rel="alternate" hrefLang="x-default" href={itUrl || baseUrl} />
        </>
      )}
      <link rel="canonical" href={canonicalHref} />

      <meta property="og:site_name" content={SITE_NAME_LONG} />
      <meta property="og:locale" content={locale} />
      <meta
        property="og:locale:alternate"
        content={lang === "en" ? "it_IT" : "en_US"}
      />
      <meta property="og:url" content={canonicalHref} />
      <meta
        property="og:type"
        content={article ? "article" : "website"}
      />
      <meta property="og:title" content={resolved.title} />
      <meta property="og:description" content={resolved.description} />
      <meta property="og:image" content={resolved.image} />
      <meta property="og:image:alt" content={resolved.imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolved.title} />
      <meta name="twitter:description" content={resolved.description} />
      <meta name="twitter:image" content={resolved.image} />

      <script type="application/ld+json">
        {JSON.stringify(jsonLdPayload)}
      </script>
    </Helmet>
  );
};

export default SEO;
