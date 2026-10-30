import { createClient } from "@supabase/supabase-js";
import type { DeviceStatus, HostMetrics } from "@ce/shared/types";
import { config } from "./config";
import { errMsg, log } from "./log";

export const db = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function setDeviceStatus(
  deviceId: string,
  status: DeviceStatus,
  extra: { status_message?: string | null; container_id?: string | null } = {},
): Promise<void> {
  const { error } = await db
    .from("devices")
    .update({ status, status_message: extra.status_message ?? null, ...("container_id" in extra ? { container_id: extra.container_id } : {}) })
    .eq("id", deviceId)
    .eq("host_id", config.hostId);
  if (error) log.error("setDeviceStatus failed", { deviceId, status, err: error.message });
}

export async function touchDevice(deviceId: string): Promise<void> {
  const { error } = await db
    .from("devices")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("host_id", config.hostId);
  if (error) log.warn("touchDevice failed", { deviceId, err: error.message });
}

export interface DeviceRow {
  id: string;
  user_id: string;
  status: DeviceStatus;
  cpu: number;
  ram_mb: number;
  storage_gb: number;
  android_version: string;
}

export async function devicesForHost(): Promise<DeviceRow[]> {
  const { data, error } = await db
    .from("devices")
    .select("id, user_id, status, cpu, ram_mb, storage_gb, android_version")
    .eq("host_id", config.hostId)
    .neq("status", "deleted");
  if (error) throw new Error(error.message);
  return (data ?? []) as DeviceRow[];
}

export async function getDevice(deviceId: string): Promise<DeviceRow | null> {
  const { data, error } = await db
    .from("devices")
    .select("id, user_id, status, cpu, ram_mb, storage_gb, android_version")
    .eq("id", deviceId)
    .eq("host_id", config.hostId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as DeviceRow | null) ?? null;
}

export async function reportHeartbeat(metrics: HostMetrics): Promise<void> {
  const { data: host, error: readErr } = await db.from("hosts").select("status").eq("id", config.hostId).maybeSingle();
  if (readErr || !host) {
    log.error("heartbeat: host row not found", { hostId: config.hostId, err: readErr?.message });
    return;
  }
  // Keep admin-set draining/maintenance; flip offline -> online.
  const status = host.status === "offline" ? "online" : host.status;
  const { error } = await db
    .from("hosts")
    .update({ last_heartbeat: new Date().toISOString(), metrics, status })
    .eq("id", config.hostId);
  if (error) log.error("heartbeat update failed", { err: error.message });
}

export async function audit(
  deviceId: string,
  userId: string,
  event: string,
  detail: Record<string, unknown> = {},
  ip?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await db.from("device_sessions").insert({
      device_id: deviceId,
      user_id: userId,
      host_id: config.hostId,
      event,
      detail,
      ip: ip ?? null,
      user_agent: userAgent ?? null,
    });
  } catch (e) {
    log.warn("audit insert failed", { err: errMsg(e) });
  }
}
