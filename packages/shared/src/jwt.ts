/** Short-lived device tokens (HS256) issued by web, verified by device-agent. */
import { SignJWT, jwtVerify } from "jose";
import type { DeviceTokenClaims, TokenScope } from "./types";

export const DEVICE_TOKEN_TTL_SECONDS = 60;
const ISSUER = "claudeemulator-web";
const AUDIENCE = "claudeemulator-agent";

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signDeviceToken(
  secret: string,
  claims: DeviceTokenClaims,
  ttlSeconds = DEVICE_TOKEN_TTL_SECONDS,
): Promise<string> {
  return new SignJWT({ did: claims.did, hid: claims.hid, scope: claims.scope })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key(secret));
}

export async function verifyDeviceToken(
  secret: string,
  token: string,
  expected: { scope: TokenScope; hostId: string; deviceId?: string },
): Promise<DeviceTokenClaims> {
  const { payload } = await jwtVerify(token, key(secret), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ["HS256"],
  });
  const claims = {
    sub: String(payload.sub),
    did: String(payload.did),
    hid: String(payload.hid),
    scope: payload.scope as TokenScope,
  };
  if (claims.scope !== expected.scope) throw new Error("token scope mismatch");
  if (claims.hid !== expected.hostId) throw new Error("token host mismatch");
  if (expected.deviceId && claims.did !== expected.deviceId) throw new Error("token device mismatch");
  return claims;
}
