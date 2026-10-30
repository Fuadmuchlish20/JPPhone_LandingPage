/**
 * Keeps Docker in line with the desired state in Supabase:
 *  - on agent boot (e.g. after host reboot): remount volumes and start devices that should run
 *  - every heartbeat: restart devices that crashed (24/7 guarantee), with a crash-loop guard
 */
import * as service from "./devices/service";
import { listManaged, LABEL_DEVICE } from "./docker/containers";
import { errMsg, log } from "./log";
import { devicesForHost, setDeviceStatus } from "./supabase";

const SHOULD_RUN = new Set(["running", "starting", "creating"]);
const CRASH_WINDOW_MS = 10 * 60_000;
const MAX_RESTARTS = 3;
const restarts = new Map<string, number[]>();

export async function reconcileOnBoot(): Promise<void> {
  const rows = await devicesForHost();
  log.info("reconcile on boot", { devices: rows.length });
  for (const row of rows) {
    try {
      if (SHOULD_RUN.has(row.status)) await service.startDevice(row.id);
      else if (row.status === "stopping") await service.stopDevice(row.id);
    } catch (e) {
      log.error("reconcile: device failed", { id: row.id, err: errMsg(e) });
    }
  }
  await reportOrphans(new Set(rows.map((r) => r.id)));
}

export async function reconcileTick(): Promise<void> {
  const rows = await devicesForHost();
  const containers = await listManaged();
  const runningIds = new Set(
    containers.filter((c) => c.State === "running").map((c) => c.Labels[LABEL_DEVICE]),
  );

  for (const row of rows) {
    if (row.status !== "running" || runningIds.has(row.id)) continue;

    const now = Date.now();
    const recent = (restarts.get(row.id) ?? []).filter((t) => now - t < CRASH_WINDOW_MS);
    if (recent.length >= MAX_RESTARTS) {
      log.error("device crash-looping, giving up", { id: row.id });
      await setDeviceStatus(row.id, "error", { status_message: "Device crashed repeatedly. Try a restart or reset." });
      restarts.delete(row.id);
      continue;
    }
    recent.push(now);
    restarts.set(row.id, recent);
    log.warn("device not running but should be, restarting", { id: row.id });
    service.startDevice(row.id).catch((e) => log.error("auto-restart failed", { id: row.id, err: errMsg(e) }));
  }
}

async function reportOrphans(known: Set<string>): Promise<void> {
  const containers = await listManaged();
  for (const c of containers) {
    const id = c.Labels[LABEL_DEVICE];
    if (id && !known.has(id)) {
      log.warn("orphan device container (not in DB for this host); leaving untouched", { id, container: c.Id });
    }
  }
}
