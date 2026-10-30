import "server-only";
import { NextResponse } from "next/server";
import { getUser } from "../auth";
import type { DeviceRow } from "../db-types";
import { getMyDevice } from "./queries";

/** For route handlers: resolve the signed-in user's device or return an error response. */
export async function ownedDevice(
  id: string,
): Promise<{ device: DeviceRow; userId: string; error?: never } | { error: NextResponse; device?: never; userId?: never }> {
  const user = await getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const device = await getMyDevice(id);
  if (!device) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  return { device, userId: user.id };
}

export function noStore(res: NextResponse): NextResponse {
  res.headers.set("cache-control", "no-store");
  return res;
}
