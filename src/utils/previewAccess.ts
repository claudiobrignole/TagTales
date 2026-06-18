export type PreviewContentType = 'exhibition' | 'writer' | 'article';

export type PreviewableDoc = {
  published?: boolean;
  isPublished?: boolean;
  previewToken?: string;
  slug?: string;
  slug_en?: string;
};

const PREVIEW_PARAM = 'preview';

export function generatePreviewToken(): string {
  return crypto.randomUUID();
}

export function isPublished(doc: PreviewableDoc | null | undefined): boolean {
  if (!doc) return false;
  return doc.published === true || doc.isPublished === true;
}

export function canViewContent(
  doc: PreviewableDoc | null | undefined,
  options: { previewToken?: string | null; isAdmin?: boolean },
): boolean {
  if (!doc) return false;
  if (options.isAdmin) return true;
  if (isPublished(doc)) return true;
  if (!options.previewToken || !doc.previewToken) return false;
  return options.previewToken === doc.previewToken;
}

export function getPreviewPath(type: PreviewContentType, slug: string, lang?: 'EN' | 'IT'): string {
  const prefix = lang === 'EN' ? '/en' : '';
  switch (type) {
    case 'exhibition':
      return `${prefix}/exhibitions/${slug}`;
    case 'writer':
      return `${prefix}/writers/${slug}`;
    case 'article':
      return `${prefix}/magazine/${slug}`;
  }
}

export function buildPreviewUrl(
  type: PreviewContentType,
  slug: string,
  token: string,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
  lang?: 'EN' | 'IT',
): string {
  const path = getPreviewPath(type, slug, lang);
  const url = new URL(path, baseUrl || 'http://localhost:3000');
  url.searchParams.set(PREVIEW_PARAM, token);
  return url.toString();
}

export function appendPreviewToLink(
  href: string,
  token?: string | null,
): string {
  if (!token) return href;
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set(PREVIEW_PARAM, token);
  return `${path}?${params.toString()}`;
}

export function getPreviewApiPath(type: PreviewContentType, slug: string, token: string): string {
  const segment =
    type === 'exhibition' ? 'exhibition' : type === 'writer' ? 'writer' : 'article';
  return `/api/preview/${segment}/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`;
}

export const PREVIEW_QUERY_PARAM = PREVIEW_PARAM;
