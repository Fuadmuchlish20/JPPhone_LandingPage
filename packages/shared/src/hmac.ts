/**
 * HMAC request signing for web -> device-agent API calls (Node only).
 *
 * signature = hex(HMAC_SHA256(secret, `${ts}.${METHOD}.${path}.${sha256hex(body)}`))
 * headers: x-ce-timestamp (unix seconds), x-ce-signature
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const HMAC_TIMESTAMP_HEADER = "x-ce-timestamp";
export const HMAC_SIGNATURE_HEADER = "x-ce-signature";
export const HMAC_MAX_SKEW_SECONDS = 60;

function sha256Hex(body: string | Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

export function signRequest(
  secret: string,
  method: string,
  path: string,
  body: string | Uint8Array = "",
  ts: number = Math.floor(Date.now() / 1000),
): Record<string, string> {
  const payload = `${ts}.${method.toUpperCase()}.${path}.${sha256Hex(body)}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return { [HMAC_TIMESTAMP_HEADER]: String(ts), [HMAC_SIGNATURE_HEADER]: sig };
}

export function verifyRequest(
  secret: string,
  method: string,
  path: string,
  body: string | Uint8Array,
  tsHeader: string | undefined,
  sigHeader: string | undefined,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!tsHeader || !sigHeader) return false;
  const ts = Number(tsHeader);
  if (!Number.isInteger(ts) || Math.abs(now - ts) > HMAC_MAX_SKEW_SECONDS) return false;
  const expected = signRequest(secret, method, path, body, ts)[HMAC_SIGNATURE_HEADER]!;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sigHeader, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
