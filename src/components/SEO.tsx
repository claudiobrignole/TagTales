import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useSeoConfig } from "../hooks/useSeoConfig";

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
}

const SITE_NAME = "Tag Tales";
const SITE_NAME_LONG = "Tag Tales Gallery";

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

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  article,
  noIndex,
  pageId,
  jsonLd,
}) => {
  const { t, i18n } = useTranslation();
  const { config } = useSeoConfig(pageId);
  const lang = i18n.language?.toLowerCase().startsWith("en") ? "en" : "it";

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://tagtalesgallery.com";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const defaultImage = `${baseUrl}/pwa-512x512.png`;

  const canonicalPath = pathname.startsWith("/en/")
    ? pathname.substring(3)
    : pathname === "/en"
      ? "/"
      : pathname;
  const itUrl = `${baseUrl}${canonicalPath === "/" ? "" : canonicalPath}` || baseUrl;
  const enUrl = `${baseUrl}/en${canonicalPath === "/" ? "" : canonicalPath}`;
  const canonicalHref = `${baseUrl}${pathname.replace(/\/$/, "") || "/"}`;

  const resolved = useMemo(() => {
    const cfgTitle =
      lang === "en" ? config?.titleEN : config?.titleIT;
    const cfgDesc =
      lang === "en" ? config?.descriptionEN : config?.descriptionIT;
    const cfgKeywords =
      lang === "en" ? config?.keywordsEN : config?.keywordsIT;

    const defaultDescription = t(
      "seo.defaultDescription",
      "Tag Tales Gallery — mostre di graffiti, writers, magazine e culture urbana.",
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
      image: image || config?.ogImageUrl || defaultImage,
      imageAlt: config?.ogImageAlt || SITE_NAME_LONG,
    };
  }, [config, description, image, keywords, lang, t, title, defaultImage]);

  const locale = lang === "en" ? "en_US" : "it_IT";
  const jsonLdPayload = useMemo(() => {
    const graph: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME_LONG,
        url: baseUrl,
        logo: `${baseUrl}/pwa-512x512.png`,
        sameAs: [
          "https://aelle.hiphop",
          "https://www.instagram.com/tagtales.gallery/",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME_LONG,
        url: baseUrl,
        inLanguage: ["it", "en"],
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ];

    if (jsonLd) {
      const extra = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      graph.push(...extra);
    }

    return graph;
  }, [baseUrl, jsonLd]);

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

      <link rel="alternate" hrefLang="it" href={itUrl || baseUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={itUrl || baseUrl} />
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
