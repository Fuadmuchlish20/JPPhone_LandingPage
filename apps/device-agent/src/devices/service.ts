/** Device lifecycle orchestration: storage + container + boot + DB status. */
import type { DeviceAction, DeviceSpec, DeviceStatus } from "@ce/shared/types";
import { CloseCode } from "@ce/shared/protocol";
import * as adb from "../adb/adb";
import * as containers from "../docker/containers";
import { errMsg, log } from "../log";
import { closeSession } from "../stream/registry";
import { getDevice, setDeviceStatus } from "../supabase";
import { ensureVolume, removeVolume, wipeVolume } from "../storage/volumes";

/* ---------- per-device mutex so concurrent actions don't interleave ---------- */
const locks = new Map<string, Promise<unknown>>();

function withLock<T>(deviceId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(deviceId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  locks.set(deviceId, next);
  void next.finally(() => {
    if (locks.get(deviceId) === next) locks.delete(deviceId);
  }).catch(() => undefined);
  return next;
}

async function specFor(deviceId: string): Promise<DeviceSpec> {
  const row = await getDevice(deviceId);
  if (!row) throw new Error("device not assigned to this host");
  return {
    deviceId,
    cpu: Number(row.cpu),
    ramMb: row.ram_mb,
    storageGb: row.storage_gb,
    androidVersion: row.android_version,
  };
}

/** Wait for Android to finish booting, then mark running. Fire-and-forget. */
function bootInBackground(deviceId: string): void {
  void (async () => {
    try {
      const ip = await containers.containerIp(deviceId);
      await adb.waitForBoot(adb.serialFor(ip));
      await setDeviceStatus(deviceId, "running");
      log.info("device booted", { deviceId });
    } catch (e) {
      log.error("device boot failed", { deviceId, err: errMsg(e) });
      await setDeviceStatus(deviceId, "error", { status_message: errMsg(e) });
    }
  })();
}

async function bringUp(spec: DeviceSpec, recreate: boolean): Promise<string> {
  const dataDir = await ensureVolume(spec.deviceId, spec.storageGb);
  let info = await containers.getContainer(spec.deviceId);
  if (!info || recreate) {
    await containers.createContainer(spec, dataDir);
    info = await containers.getContainer(spec.deviceId);
  }
  if (!info) throw new Error("container creation failed");
  await setDeviceStatus(spec.deviceId, "starting", { container_id: info.Id });
  await containers.startContainer(spec.deviceId);
  bootInBackground(spec.deviceId);
  return info.Id;
}

async function bringDown(deviceId: string): Promise<void> {
  closeSession(deviceId, CloseCode.DeviceUnavailable, "device stopping");
  try {
    const ip = await containers.containerIp(deviceId);
    await adb.disconnect(adb.serialFor(ip));
  } catch {
    /* not running */
  }
  await containers.stopContainer(deviceId);
}

async function guarded<T>(deviceId: string, failStatus: DeviceStatus, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    log.error("device operation failed", { deviceId, err: errMsg(e) });
    await setDeviceStatus(deviceId, failStatus, { status_message: errMsg(e) });
    throw e;
  }
}

export function createDevice(spec: DeviceSpec): Promise<string> {
  return withLock(spec.deviceId, () =>
    guarded(spec.deviceId, "error", async () => {
      await setDeviceStatus(spec.deviceId, "creating");
      return bringUp(spec, true);
    }),
  );
}

export function startDevice(deviceId: string): Promise<DeviceStatus> {
  return withLock(deviceId, () =>
    guarded(deviceId, "error", async () => {
      await bringUp(await specFor(deviceId), false);
      return "starting" as const;
    }),
  );
}

export function stopDevice(deviceId: string): Promise<DeviceStatus> {
  return withLock(deviceId, () =>
    guarded(deviceId, "error", async () => {
      await setDeviceStatus(deviceId, "stopping");
      await bringDown(deviceId);
      await setDeviceStatus(deviceId, "stopped");
      return "stopped" as const;
    }),
  );
}

export function restartDevice(deviceId: string): Promise<DeviceStatus> {
  return withLock(deviceId, () =>
    guarded(deviceId, "error", async () => {
      await setDeviceStatus(deviceId, "stopping");
      await bringDown(deviceId);
      await bringUp(await specFor(deviceId), false);
      return "starting" as const;
    }),
  );
}

/** Factory reset: wipe /data and recreate the container. */
export function resetDevice(deviceId: string): Promise<DeviceStatus> {
  return withLock(deviceId, () =>
    guarded(deviceId, "error", async () => {
      const spec = await specFor(deviceId);
      await setDeviceStatus(deviceId, "stopping");
      await bringDown(deviceId);
      await containers.removeContainer(deviceId);
      await wipeVolume(deviceId, spec.storageGb);
      await bringUp(spec, true);
      return "starting" as const;
    }),
  );
}

export function deleteDevice(deviceId: string): Promise<void> {
  return withLock(deviceId, () =>
    guarded(deviceId, "error", async () => {
      await bringDown(deviceId);
      await containers.removeContainer(deviceId);
      await removeVolume(deviceId);
      await setDeviceStatus(deviceId, "deleted", { container_id: null });
    }),
  );
}

export function runAction(deviceId: string, action: DeviceAction): Promise<DeviceStatus> {
  switch (action) {
    case "start":
      return startDevice(deviceId);
    case "stop":
      return stopDevice(deviceId);
    case "restart":
      return restartDevice(deviceId);
    case "reset":
      return resetDevice(deviceId);
  }
}
