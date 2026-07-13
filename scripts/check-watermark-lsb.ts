/**
 * Optional CLI: node --import tsx scripts/check-watermark-lsb.ts <png-path>
 * Prints extracted LSB payload if present.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { extractLsbPayload } from "../src/utils/watermarkImageServer.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/check-watermark-lsb.ts <image.png>");
  process.exit(1);
}

const abs = path.resolve(file);
const buf = fs.readFileSync(abs);
const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const payload = extractLsbPayload(data);
if (!payload) {
  console.error("No LSB payload found");
  process.exit(2);
}
console.log(payload);
