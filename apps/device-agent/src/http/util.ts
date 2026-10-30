import type { IncomingMessage, ServerResponse } from "node:http";
import { HMAC_SIGNATURE_HEADER, HMAC_TIMESTAMP_HEADER, verifyRequest } from "@ce/shared/hmac";
import { config } from "../config";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(data) });
  res.end(data);
}

export function readBody(req: IncomingMessage, limit = 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, "payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function header(req: IncomingMessage, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

/** Verify HMAC over the raw body. Returns the parsed JSON body (or {}). */
export async function requireHmac<T = Record<string, unknown>>(req: IncomingMessage, pathname: string): Promise<T> {
  const body = await readBody(req);
  const ok = verifyRequest(
    config.hmacSecret,
    req.method ?? "GET",
    pathname,
    body,
    header(req, HMAC_TIMESTAMP_HEADER),
    header(req, HMAC_SIGNATURE_HEADER),
  );
  if (!ok) throw new HttpError(401, "unauthorized");
  if (body.length === 0) return {} as T;
  try {
    return JSON.parse(body.toString("utf8")) as T;
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export function setCors(req: IncomingMessage, res: ServerResponse): void {
  if (req.headers.origin === config.webOrigin) {
    res.setHeader("access-control-allow-origin", config.webOrigin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-methods", "POST, OPTIONS");
    res.setHeader("access-control-allow-headers", "authorization, content-type");
    res.setHeader("access-control-max-age", "600");
  }
}

export function bearer(req: IncomingMessage): string | null {
  const h = header(req, "authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}
