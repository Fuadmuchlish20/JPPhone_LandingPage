import { NextResponse } from "next/server";
import { issueDeviceToken } from "@/lib/devices/service";
import { noStore, ownedDevice } from "@/lib/devices/route-auth";

/** Browser gets a 60s JWT + the host's WebSocket URL for this device. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await ownedDevice(id);
  if (r.error) return r.error;
  if (r.device.status !== "running") {
    return NextResponse.json({ error: "device_not_running", status: r.device.status }, { status: 409 });
  }
  const { token, wsUrl } = await issueDeviceToken(r.device, r.userId, "stream");
  return noStore(NextResponse.json({ token, wsUrl }));
}
