/**
 * Per-device /data storage.
 *  loop mode: <DEVICES_DIR>/<id>.img (sparse ext4, hard size limit) mounted at <DEVICES_DIR>/<id>
 *  dir mode:  plain folder <DEVICES_DIR>/<id> (no size limit, dev only)
 * DEVICES_DIR must be the same path on host and inside the agent container,
 * and mounted with rshared propagation so loop mounts are visible to Docker.
 */
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { config } from "../config";
import { log } from "../log";
import { run } from "../util/exec";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function assertDeviceId(id: string): void {
  if (!UUID_RE.test(id)) throw new Error("invalid device id");
}

export function dataPath(id: string): string {
  assertDeviceId(id);
  return path.join(config.devicesDir, id);
}

function imagePath(id: string): string {
  assertDeviceId(id);
  return path.join(config.devicesDir, `${id}.img`);
}

async function isMounted(p: string): Promise<boolean> {
  const r = await run("mountpoint", ["-q", p], { allowFail: true });
  return r.code === 0;
}

export async function ensureVolume(id: string, sizeGb: number): Promise<string> {
  const mnt = dataPath(id);
  await mkdir(mnt, { recursive: true });
  if (config.storageMode === "dir") return mnt;

  const img = imagePath(id);
  if (!existsSync(img)) {
    log.info("creating device image", { id, sizeGb });
    await run("truncate", ["-s", `${sizeGb}G`, img]);
    await run("mkfs.ext4", ["-q", "-F", "-m", "0", "-E", "lazy_itable_init=1", img], { timeoutMs: 120_000 });
  }
  if (!(await isMounted(mnt))) {
    await run("mount", ["-o", "loop,noatime", img, mnt]);
  }
  return mnt;
}

export async function unmountVolume(id: string): Promise<void> {
  if (config.storageMode === "dir") return;
  const mnt = dataPath(id);
  if (!(await isMounted(mnt))) return;
  const r = await run("umount", [mnt], { allowFail: true });
  if (r.code !== 0) {
    log.warn("umount failed, using lazy unmount", { id, err: r.stderr.trim() });
    await run("umount", ["-l", mnt]);
  }
}

/** Factory reset: drop all user data, keep the size. */
export async function wipeVolume(id: string, sizeGb: number): Promise<string> {
  await removeVolume(id);
  return ensureVolume(id, sizeGb);
}

export async function removeVolume(id: string): Promise<void> {
  await unmountVolume(id);
  if (config.storageMode === "loop") await rm(imagePath(id), { force: true });
  await rm(dataPath(id), { recursive: true, force: true });
}
