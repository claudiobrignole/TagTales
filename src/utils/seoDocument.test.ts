import { describe, expect, it } from "vitest";
import {
  HOME_TITLE,
  applySeoHtml,
  canonicalUrl,
  composePublicSeo,
  exhibitionMeta,
  homeDescription,
  hreflangPair,
  normalizePath,
  resolvePublicRedirect,
  sitemapLoc,
} from "./seoDocument";

const catalog = {
  exhibitions: [
    {
      id: "ex1",
      slug: "shaone-first-line",
      slugEn: "shaone-first-line",
      titleIt: "FIRST LINE",
      titleEn: "FIRST LINE",
      introIt: "Dagli anni 80, uno dei primi writer italiani",
      introEn: "Since the 80s, one of the first Italian graffiti writers",
      artist: "Shaone",
      city: "Lugano",
      start: "",
      end: "",
      author: "",
      featured: true,
    },
  ],
  writers: [
    {
      id: "w1",
      slug: "shaone",
      slugEn: "shaone",
      titleIt: "Shaone",
      titleEn: "Shaone",
      introIt: "Paolo Shaone Romano è un writer napoletano.",
      introEn: "Paolo Shaone Romano is a Neapolitan writer.",
      artist: "Shaone",
      city: "Napoli",
      start: "",
      end: "",
      author: "",
      featured: false,
    },
  ],
  articles: [
    {
      id: "a1",
      slug: "ink-beats",
      slugEn: "ink-beats",
      titleIt: "INK & BEATS",
      titleEn: "INK & BEATS",
      introIt: "Luca Barcellona, writer e calligrafo.",
      introEn: "Luca Barcellona, writer and calligrapher.",
      artist: "",
      city: "",
      start: "",
      end: "",
      author: "Claudio SID Brignole",
      featured: false,
    },
  ],
  pages: [],
};

describe("canonical URLs", () => {
  it("strips the trailing slash and keeps /en without one", () => {
    expect(normalizePath("/en/")).toBe("/en");
    expect(normalizePath("/exhibitions/")).toBe("/exhibitions");
    expect(canonicalUrl("/en/")).toBe("https://tagtalesgallery.com/en");
    expect(canonicalUrl("/")).toBe("https://tagtalesgallery.com");
    expect(sitemapLoc("/")).toBe("https://tagtalesgallery.com");
  });

  it("redirects the discarded slash-sensitive and legacy URLs", () => {
    expect(resolvePublicRedirect("/en/assistenza")).toBe("/en/support");
    expect(resolvePublicRedirect("/en/su-di-noi")).toBe("/en/about");
    expect(resolvePublicRedirect("/info/home")).toBe("/");
    expect(resolvePublicRedirect("/info/contatti")).toBeNull();
    expect(resolvePublicRedirect("/magazine/birth-of-nyc-style-writing")).toBe(
      "/magazine",
    );
  });
});

describe("hreflang", () => {
  it("points x-default at Italian and pairs assistenza with support", () => {
    expect(hreflangPair("/assistenza")).toEqual({
      it: "https://tagtalesgallery.com/assistenza",
      en: "https://tagtalesgallery.com/en/support",
    });
    expect(hreflangPair("/en/support")).toEqual({
      it: "https://tagtalesgallery.com/assistenza",
      en: "https://tagtalesgallery.com/en/support",
    });
    expect(hreflangPair("/")).toEqual({
      it: "https://tagtalesgallery.com",
      en: "https://tagtalesgallery.com/en",
    });
  });
});

describe("titles and descriptions", () => {
  it("uses the Lugano home titles and mentions the current show", () => {
    expect(HOME_TITLE.it).toBe("Tag Tales – Galleria di street art a Lugano");
    expect(HOME_TITLE.en).toBe("Tag Tales – Street art gallery in Lugano");
    const it = homeDescription("it", { title: "FIRST LINE", artist: "Shaone" });
    const en = homeDescription("en", { title: "FIRST LINE", artist: "Shaone" });
    expect(it).toContain("FIRST LINE");
    expect(it).toContain("Lugano");
    expect(it.length).toBeGreaterThanOrEqual(120);
    expect(it.length).toBeLessThanOrEqual(170);
    expect(en).toContain("FIRST LINE");
    expect(en).toContain("Lugano");
  });

  it("builds a unique exhibition title from name, artist and city", () => {
    const meta = exhibitionMeta("it", {
      title: "FIRST LINE",
      artist: "Shaone",
      city: "Lugano",
      intro: "Dagli anni 80, uno dei primi writer italiani",
    });
    expect(meta.title).toBe(
      "FIRST LINE – Mostra di Shaone a Lugano | Tag Tales",
    );
    expect(meta.description).toContain("Shaone");
    expect(meta.description).toContain("Lugano");
  });
});

describe("initial HTML", () => {
  it("injects title, canonical, hreflang, json-ld and an h1", () => {
    const seo = composePublicSeo({ pathname: "/", catalog });
    const html = applySeoHtml(
      `<html lang="it"><head><!--META_TITLE--><!--META_DESCRIPTION--><!--META_KEYWORDS--><!--META_OG_IMAGE--><!--META_JSONLD--></head><body><div id="root"><!--SEO_SNAPSHOT--></div></body></html>`,
      seo,
    );
    expect(html).toContain(`<html lang="it"`);
    expect(html).toContain(`<title>${HOME_TITLE.it}</title>`);
    expect(html).toContain(
      `<link rel="canonical" href="https://tagtalesgallery.com">`,
    );
    expect(html).toContain(`hreflang="x-default" href="https://tagtalesgallery.com"`);
    expect(html).toContain(`"@type":"ArtGallery"`);
    expect(html).toContain("Via Monte Carmen 10");
    expect(html).toContain("https://brignole.ch");
    expect(html).toContain("<h1>");
    expect(html).toContain('href="/exhibitions/shaone-first-line"');

    const en = composePublicSeo({ pathname: "/en", catalog });
    expect(en.htmlLang).toBe("en");
    expect(en.title).toBe(HOME_TITLE.en);
    expect(en.canonical).toBe("https://tagtalesgallery.com/en");
  });

  it("returns a real not-found document without hreflang", () => {
    const seo = composePublicSeo({ pathname: "/missing", notFound: true });
    expect(seo.status).toBe(404);
    expect(seo.robots).toContain("noindex");
    expect(seo.hreflang).toBeNull();
    expect(seo.snapshot).toContain("Pagina non trovata");
  });
});
