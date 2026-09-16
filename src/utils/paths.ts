/**
 * IT/EN public path helpers for crawlable internal links.
 * Keep new public routes wired through these so EN never points at IT URLs.
 */

export type SiteLang = "IT" | "EN" | "it" | "en" | string;

export function isEnglish(lang: SiteLang): boolean {
  return String(lang).toLowerCase() === "en";
}

/** Map an Italian path to the correct URL for the active language. */
export function localizedPath(
  lang: SiteLang,
  itPath: string,
  enPath?: string,
): string {
  const path = itPath.startsWith("/") ? itPath : `/${itPath}`;
  if (!isEnglish(lang)) return path;
  const en = enPath ?? path;
  if (en === "/" || en === "") return "/en";
  return en.startsWith("/en") ? en : `/en${en.startsWith("/") ? en : `/${en}`}`;
}

/** Home for the active language. */
export function homePath(lang: SiteLang): string {
  return isEnglish(lang) ? "/en" : "/";
}

/** Detail URL with optional EN slug. */
export function localizedDetailPath(
  lang: SiteLang,
  collectionPath: "/exhibitions" | "/writers" | "/magazine" | "/info",
  slugIt: string,
  slugEn?: string,
): string {
  const slug = isEnglish(lang) ? slugEn || slugIt : slugIt;
  return localizedPath(lang, `${collectionPath}/${slug}`);
}
