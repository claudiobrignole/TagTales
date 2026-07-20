import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp, { type OverlayOptions } from "sharp";

const WATERMARK_TEXT = "tagtalesgallery.com";
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;

const ALLOWED_HOST_PATTERNS = [
  /(^|\.)firebasestorage\.googleapis\.com$/i,
  /(^|\.)firebasestorage\.app$/i,
  /(^|\.)storage\.googleapis\.com$/i,
  /(^|\.)appspot\.com$/i,
];

type CacheEntry = { buffer: Buffer; contentType: string; expiresAt: number };
const memoryCache = new Map<string, CacheEntry>();

export type WatermarkBakeMode = "both" | "text" | "logo";

export function parseWatermarkBakeMode(raw: unknown): WatermarkBakeMode {
  if (raw === "text" || raw === "logo" || raw === "both") return raw;
  return "both";
}

export function isAllowedWatermarkSrc(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    return ALLOWED_HOST_PATTERNS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

function cacheKey(src: string, mode: WatermarkBakeMode): string {
  return crypto.createHash("sha256").update(`${mode}|${src}`).digest("hex");
}

function getCached(key: string): CacheEntry | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry;
}

function setCached(key: string, buffer: Buffer, contentType: string) {
  if (memoryCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, {
    buffer,
    contentType,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function embedLsbPayload(rgba: Buffer, payload: string): void {
  const bytes = Buffer.from(payload, "utf8");
  const bitLength = bytes.length * 8;
  const totalBits = 32 + bitLength;
  const maxBits = Math.floor(rgba.length / 4);
  if (totalBits > maxBits) {
    throw new Error("Image too small for watermark payload");
  }

  const writeBit = (bitIndex: number, bit: number) => {
    const pixelOffset = bitIndex * 4;
    rgba[pixelOffset] = (rgba[pixelOffset] & 0xfe) | (bit & 1);
  };

  for (let i = 0; i < 32; i++) {
    writeBit(i, (bytes.length >> (31 - i)) & 1);
  }
  for (let i = 0; i < bitLength; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitInByte = 7 - (i % 8);
    writeBit(32 + i, (bytes[byteIndex] >> bitInByte) & 1);
  }
}

/** Extract LSB payload for verification scripts. */
export function extractLsbPayload(rgba: Buffer): string | null {
  const readBit = (bitIndex: number) => rgba[bitIndex * 4] & 1;
  let length = 0;
  for (let i = 0; i < 32; i++) {
    length = (length << 1) | readBit(i);
  }
  if (length <= 0 || length > 512) return null;
  const bytes = Buffer.alloc(length);
  for (let i = 0; i < length * 8; i++) {
    const bit = readBit(32 + i);
    const byteIndex = Math.floor(i / 8);
    const bitInByte = 7 - (i % 8);
    bytes[byteIndex] = bytes[byteIndex] | (bit << bitInByte);
  }
  return bytes.toString("utf8");
}

async function buildOverlaySvg(width: number, height: number): Promise<Buffer> {
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.022));
  const stepX = Math.max(120, Math.round(fontSize * 14));
  const stepY = Math.max(48, Math.round(fontSize * 5.5));
  const lines: string[] = [];

  // Cover full canvas including rotated overhang (no tile cap — large 1–2 col images need full fill)
  const padX = stepX * 2;
  const padY = stepY * 2;
  for (let y = -padY; y < height + padY; y += stepY) {
    const row = Math.floor((y + padY) / stepY);
    const offset = (row % 2) * Math.round(stepX / 2);
    for (let x = -padX; x < width + padX; x += stepX) {
      lines.push(
        `<text x="${x + offset}" y="${y}" transform="rotate(-28 ${x + offset} ${y})" fill="#ffffff" fill-opacity="0.12" font-family="Karla, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="400">${WATERMARK_TEXT}</text>`,
      );
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${lines.join("\n  ")}
</svg>`;
  return Buffer.from(svg);
}

async function loadLogoLowAlpha(targetHeight: number): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
} | null> {
  const logoPath = path.resolve(process.cwd(), "public/TAGTALES-2lines-white.png");
  if (!fs.existsSync(logoPath)) return null;
  try {
    // White logo on black: drop black bg, keep white strokes at low opacity
    const resized = await sharp(logoPath)
      .resize({ height: Math.max(24, targetHeight), fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < resized.data.length; i += 4) {
      const r = resized.data[i];
      const g = resized.data[i + 1];
      const b = resized.data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 40) {
        resized.data[i + 3] = 0;
      } else {
        resized.data[i] = 255;
        resized.data[i + 1] = 255;
        resized.data[i + 2] = 255;
        resized.data[i + 3] = Math.round(255 * 0.14);
      }
    }

    const buffer = await sharp(resized.data, {
      raw: {
        width: resized.info.width,
        height: resized.info.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    return {
      buffer,
      width: resized.info.width,
      height: resized.info.height,
    };
  } catch {
    return null;
  }
}

/**
 * Bake micro watermark + LSB payload into an image buffer.
 */
export async function watermarkImageBuffer(
  upstream: Buffer,
  srcForPayload: string,
  mode: WatermarkBakeMode = "both",
): Promise<{ buffer: Buffer; contentType: string; payload: string }> {
  if (upstream.length > 25 * 1024 * 1024) {
    throw new Error("Image too large");
  }

  const srcHash = crypto.createHash("sha256").update(srcForPayload).digest("hex").slice(0, 16);
  const payload = `TTG|${WATERMARK_TEXT}|${mode}|${srcHash}`;

  const image = sharp(upstream).rotate();
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) {
    throw new Error("Invalid image dimensions");
  }

  const showText = mode === "both" || mode === "text";
  const showLogo = mode === "both" || mode === "logo";

  const composites: OverlayOptions[] = [];
  if (showText) {
    composites.push({ input: await buildOverlaySvg(width, height), blend: "over" });
  }

  if (showLogo) {
    const logoH = Math.max(18, Math.round(Math.min(width, height) * 0.04));
    const logo = await loadLogoLowAlpha(logoH);
    if (logo) {
      const left = Math.max(0, Math.round(width * 0.02));
      const top = Math.max(0, height - logo.height - Math.round(height * 0.045));
      composites.push({ input: logo.buffer, left, top, blend: "over" });
    }
  }

  let pipeline = image.ensureAlpha();
  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  const { data: rgba, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  embedLsbPayload(rgba, payload);

  const out = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 8 })
    .toBuffer();

  return { buffer: out, contentType: "image/png", payload };
}

/**
 * Fetch remote image, bake micro watermark + LSB payload, return PNG buffer.
 */
export async function createWatermarkedImage(
  src: string,
  mode: WatermarkBakeMode = "both",
): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const key = cacheKey(src, mode);
  const cached = getCached(key);
  if (cached) return { buffer: cached.buffer, contentType: cached.contentType };

  const response = await fetch(src, {
    redirect: "follow",
    headers: { "User-Agent": "TagTales-Watermark/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Upstream fetch failed: ${response.status}`);
  }
  const upstream = Buffer.from(await response.arrayBuffer());
  const { buffer, contentType } = await watermarkImageBuffer(upstream, src, mode);

  setCached(key, buffer, contentType);
  return { buffer, contentType };
}
