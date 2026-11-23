import { createHmac, timingSafeEqual } from "crypto";

/** HMAC-SHA256 of the raw body, base64, header X-Fourthwall-Hmac-SHA256. */
export function fourthwallSignature(rawBody: Buffer | string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}

export function verifyFourthwallSignature(
  rawBody: Buffer | string,
  header: string | undefined,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const expected = fourthwallSignature(rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(header.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
