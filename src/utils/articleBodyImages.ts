const DATA_IMAGE_SRC_RE =
  /src=(["'])(data:image\/[a-zA-Z0-9.+-]+;base64,[^"']+)\1/gi;

const IMG_TAG_RE = /<img\b[^>]*>/gi;
const IMAGE_TOKEN_RE = /<!--\s*TTIMG_(\d+)\s*-->/g;

export function extractDataImageUrls(html: string): string[] {
  const urls: string[] = [];
  for (const match of html.matchAll(DATA_IMAGE_SRC_RE)) {
    urls.push(match[2]);
  }
  return [...new Set(urls)];
}

export function dataUrlToFile(dataUrl: string, name = "inline-image"): File {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error("Immagine incorporata non valida.");
  }
  const mime = match[1];
  const binary = atob(match[2].replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const subtype = mime.slice("image/".length).split("+")[0] || "img";
  const ext = subtype === "jpeg" ? "jpg" : subtype;
  return new File([bytes], `${name}.${ext}`, { type: mime });
}

/** Swap <img> tags for stable tokens so translation cannot rewrite their src. */
export function shieldArticleImages(html: string): { html: string; images: string[] } {
  const images: string[] = [];
  const shielded = html.replace(IMG_TAG_RE, (tag) => {
    const token = `<!--TTIMG_${images.length}-->`;
    images.push(tag);
    return token;
  });
  return { html: shielded, images };
}

export function unshieldArticleImages(html: string, images: string[]): string {
  if (!html || images.length === 0) return html || "";
  return html.replace(IMAGE_TOKEN_RE, (token, index) => images[Number(index)] ?? token);
}
