import "server-only";
import { notify } from "./account/notify";
import { agent } from "./agent/client";
import type { DeviceRow, HostRow, PlanRow } from "./db-types";
import { adminClient } from "./supabase/admin";

const HEARTBEAT_STALE_MS = 2 * 60_000;
const MAX_STOPS_PER_RUN = 100;

export interface SchedulerReport {
  hostsMarkedOffline: number;
  subscriptionsExpired: number;
  stoppedExpired: string[];
  stoppedIdle: string[];
  failures: { deviceId: string; error: string }[];
}

export async function runScheduler(): Promise<SchedulerReport> {
  const db = adminClient();
  const now = new Date();
  const report: SchedulerReport = {
    hostsMarkedOffline: 0,
    subscriptionsExpired: 0,
    stoppedExpired: [],
    stoppedIdle: [],
    failures: [],
  };

  // 1. hosts that stopped heartbeating
  const staleBefore = new Date(now.getTime() - HEARTBEAT_STALE_MS).toISOString();
  const { data: offline } = await db
    .from("hosts")
    .update({ status: "offline" })
    .eq("status", "online")
    .or(`last_heartbeat.is.null,last_heartbeat.lt.${staleBefore}`)
    .select("id");
  report.hostsMarkedOffline = offline?.length ?? 0;

  // 2. subscriptions past their period
  const { data: expiredSubs } = await db
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("current_period_end", now.toISOString())
    .select("id, user_id");
  report.subscriptionsExpired = expiredSubs?.length ?? 0;
  for (const s of (expiredSubs ?? []) as { user_id: string }[]) {
    await notify(s.user_id, {
      kind: "warning",
      title: "Your plan has expired",
      body: "Your devices have been stopped. Renew your plan to start them again — your data is kept.",
      link: "/redeem?type=renew",
    });
  }

  // 3 + 4. devices to stop
  const { data: devices } = await db
    .from("devices")
    .select("*")
    .in("status", ["running", "starting"]);
  const { data: plans } = await db.from("plans").select("id, idle_stop_minutes");
  const { data: hosts } = await db.from("hosts").select("id, public_url, status");
  const planIdle = new Map((plans as Pick<PlanRow, "id" | "idle_stop_minutes">[] | null ?? []).map((p) => [p.id, p.idle_stop_minutes]));
  const hostById = new Map((hosts as Pick<HostRow, "id" | "public_url" | "status">[] | null ?? []).map((h) => [h.id, h]));

  const toStop: { device: DeviceRow; reason: "expired" | "idle" }[] = [];
  for (const d of (devices ?? []) as DeviceRow[]) {
    if (new Date(d.expires_at) < now) {
      toStop.push({ device: d, reason: "expired" });
      continue;
    }
    const idle = planIdle.get(d.plan_id);
    if (idle && now.getTime() - new Date(d.last_active_at).getTime() > idle * 60_000) {
      toStop.push({ device: d, reason: "idle" });
    }
  }

  for (const { device, reason } of toStop.slice(0, MAX_STOPS_PER_RUN)) {
    const host = hostById.get(device.host_id);
    if (!host || host.status === "offline") continue;
    try {
      await agent.action(host, device.id, "stop");
      await db.from("device_sessions").insert({
        device_id: device.id,
        user_id: device.user_id,
        host_id: device.host_id,
        event: `scheduler:stop_${reason}`,
      });
      (reason === "expired" ? report.stoppedExpired : report.stoppedIdle).push(device.id);
    } catch (e) {
      report.failures.push({ deviceId: device.id, error: (e as Error).message });
    }
  }
  return report;
}
