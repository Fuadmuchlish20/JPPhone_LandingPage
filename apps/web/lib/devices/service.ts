import "server-only";
import type { DeviceAction } from "@ce/shared/types";
import { signDeviceToken } from "@ce/shared/jwt";
import { agent, AgentError, wsBaseUrl } from "../agent/client";
import type { DeviceRow } from "../db-types";
import { serverEnv } from "../env";
import { adminClient } from "../supabase/admin";
import { getHost } from "./queries";

const ALLOC_ERRORS: Record<string, string> = {
  NO_ACTIVE_SUBSCRIPTION: "You need an active plan to create a device.",
  DEVICE_LIMIT_REACHED: "You've reached the device limit for your plan.",
  NO_CAPACITY: "No capacity in this region right now. Try another region or later.",
  ANDROID_VERSION_UNAVAILABLE: "Your plan doesn't include that Android version.",
};

export class UserFacingError extends Error {}

function friendly(e: unknown): string {
  if (e instanceof UserFacingError || e instanceof AgentError) return e.message;
  return "Something went wrong. Please try again.";
}

async function audit(device: DeviceRow, userId: string, event: string, detail: Record<string, unknown> = {}) {
  await adminClient()
    .from("device_sessions")
    .insert({ device_id: device.id, user_id: userId, host_id: device.host_id, event, detail });
}

export async function createDevice(
  userId: string,
  region: string,
  name: string,
  androidVersion: string,
): Promise<{ error?: string; device?: DeviceRow }> {
  const db = adminClient();
  const { data, error } = await db.rpc("allocate_device", {
    p_user: userId,
    p_region: region,
    p_name: name,
    p_android: androidVersion,
  });
  if (error) {
    const code = Object.keys(ALLOC_ERRORS).find((k) => error.message.includes(k));
    return { error: code ? ALLOC_ERRORS[code] : "Could not allocate a device." };
  }
  const device = data as DeviceRow;
  try {
    const host = await getHost(device.host_id);
    await agent.createDevice(host, {
      deviceId: device.id,
      cpu: Number(device.cpu),
      ramMb: device.ram_mb,
      storageGb: device.storage_gb,
      androidVersion: device.android_version,
    });
    await audit(device, userId, "action:create", { region, android: device.android_version });
    return { device };
  } catch (e) {
    await db.from("devices").update({ status: "error", status_message: friendly(e) }).eq("id", device.id);
    return { error: friendly(e) };
  }
}

export async function runDeviceAction(device: DeviceRow, actorId: string, action: DeviceAction): Promise<{ error?: string }> {
  if (action === "start" && new Date(device.expires_at) < new Date()) {
    return { error: "Your plan has expired. Renew to start this device." };
  }
  try {
    const host = await getHost(device.host_id);
    await agent.action(host, device.id, action);
    await audit(device, actorId, `action:${action}`);
    return {};
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function removeDevice(device: DeviceRow, actorId: string): Promise<{ error?: string }> {
  try {
    const host = await getHost(device.host_id);
    await agent.remove(host, device.id);
    await audit(device, actorId, "action:delete");
    return {};
  } catch (e) {
    return { error: friendly(e) };
  }
}

/** Short-lived token + endpoint for the browser to talk to the device host directly. */
export async function issueDeviceToken(device: DeviceRow, userId: string, scope: "stream" | "apk") {
  const host = await getHost(device.host_id);
  const token = await signDeviceToken(serverEnv.streamJwtSecret, {
    sub: userId,
    did: device.id,
    hid: host.id,
    scope,
  });
  return {
    token,
    wsUrl: `${wsBaseUrl(host.public_url)}/stream/${device.id}`,
    uploadUrl: new URL(`/api/devices/${device.id}/install-apk`, host.public_url).toString(),
  };
}
