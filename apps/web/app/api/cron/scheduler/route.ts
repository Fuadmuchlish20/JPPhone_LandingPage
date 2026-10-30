import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { runScheduler } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${serverEnv.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await runScheduler();
  return NextResponse.json(report);
}
