import { NextResponse } from "next/server";
import { issueDeviceToken } from "@/lib/devices/service";
import { noStore, ownedDevice } from "@/lib/devices/route-auth";

/**
 * APKs are uploaded by the browser straight to the device host (Vercel functions
 * cap request bodies at a few MB). This returns the upload URL + a 60s JWT.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await ownedDevice(id);
  if (r.error) return r.error;
  if (r.device.status !== "running") {
    return NextResponse.json({ error: "device_not_running" }, { status: 409 });
  }
  const { token, uploadUrl } = await issueDeviceToken(r.device, r.userId, "apk");
  return noStore(NextResponse.json({ token, uploadUrl }));
}
