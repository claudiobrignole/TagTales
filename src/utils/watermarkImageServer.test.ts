import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  extractLsbPayload,
  isAllowedWatermarkSrc,
  watermarkImageBuffer,
} from "./watermarkImageServer";

describe("watermarkImageServer", () => {
  it("allows Firebase Storage hosts only over https", () => {
    expect(
      isAllowedWatermarkSrc(
        "https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media",
      ),
    ).toBe(true);
    expect(
      isAllowedWatermarkSrc(
        "https://gen-lang-client-0591253558.firebasestorage.app/o/x",
      ),
    ).toBe(true);
    expect(isAllowedWatermarkSrc("http://firebasestorage.googleapis.com/x")).toBe(
      false,
    );
    expect(isAllowedWatermarkSrc("https://evil.example.com/x.png")).toBe(false);
  });

  it("embeds recoverable LSB payload and differs from original", async () => {
    const logoPath = path.resolve(process.cwd(), "public/logo.png");
    const original = fs.readFileSync(logoPath);
    // Shrink for speed
    const small = await sharp(original).resize({ width: 320 }).png().toBuffer();
    const src = "https://firebasestorage.googleapis.com/v0/b/demo/o/art.png";
    const { buffer, payload } = await watermarkImageBuffer(small, src, "both");

    expect(buffer.equals(small)).toBe(false);
    expect(payload.startsWith("TTG|tagtalesgallery.com|both|")).toBe(true);

    const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    expect(extractLsbPayload(data)).toBe(payload);
  }, 30000);
});
