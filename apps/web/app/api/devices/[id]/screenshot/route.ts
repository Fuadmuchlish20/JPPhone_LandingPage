import { NextResponse } from "next/server";
import { agent, AgentError } from "@/lib/agent/client";
import { getHost } from "@/lib/devices/queries";
import { ownedDevice } from "@/lib/devices/route-auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await ownedDevice(id);
  if (r.error) return r.error;
  if (r.device.status !== "running") return NextResponse.json({ error: "device_not_running" }, { status: 409 });

  try {
    const png = await agent.screenshot(await getHost(r.device.host_id), r.device.id);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new NextResponse(png, {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="screenshot-${stamp}.png"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const status = e instanceof AgentError ? e.status : 500;
    return NextResponse.json({ error: "screenshot_failed", message: (e as Error).message }, { status });
  }
}
