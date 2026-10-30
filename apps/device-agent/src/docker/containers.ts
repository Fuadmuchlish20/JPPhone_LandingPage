/** Redroid container lifecycle via the Docker Engine API. */
import Docker from "dockerode";
import type { DeviceSpec } from "@ce/shared/types";
import { config } from "../config";
import { log } from "../log";

export const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || "/var/run/docker.sock" });

export const LABEL_MANAGED = "ce.managed";
export const LABEL_DEVICE = "ce.device_id";

export function containerName(deviceId: string): string {
  return `ce-dev-${deviceId}`;
}

export function specFromLabels(labels: Record<string, string>): DeviceSpec | null {
  const deviceId = labels[LABEL_DEVICE];
  if (!deviceId) return null;
  return {
    deviceId,
    cpu: Number(labels["ce.cpu"]),
    ramMb: Number(labels["ce.ram_mb"]),
    storageGb: Number(labels["ce.storage_gb"]),
    androidVersion: labels["ce.android"] ?? "13",
  };
}

/** Redroid image for an Android version; throws for versions this host does not offer. */
export function imageFor(androidVersion: string): string {
  const image = config.redroidImages[androidVersion];
  if (!image) throw new Error(`Android ${androidVersion} is not available on this host`);
  return image;
}

export async function ensureImage(image: string): Promise<void> {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    /* not present */
  }
  log.info("pulling image", { image });
  const stream = await docker.pull(image);
  await new Promise<void>((resolve, reject) =>
    docker.modem.followProgress(stream, (err) => (err ? reject(err) : resolve())),
  );
}

export async function getContainer(deviceId: string): Promise<Docker.ContainerInspectInfo | null> {
  try {
    return await docker.getContainer(containerName(deviceId)).inspect();
  } catch (e) {
    if ((e as { statusCode?: number }).statusCode === 404) return null;
    throw e;
  }
}

export async function createContainer(spec: DeviceSpec, dataDir: string): Promise<string> {
  const image = imageFor(spec.androidVersion);
  await ensureImage(image);
  const existing = await getContainer(spec.deviceId);
  if (existing) await docker.getContainer(existing.Id).remove({ force: true });

  const memory = Math.round(spec.ramMb * 1024 * 1024);
  const container = await docker.createContainer({
    name: containerName(spec.deviceId),
    Image: image,
    Cmd: [
      `androidboot.redroid_width=${config.device.width}`,
      `androidboot.redroid_height=${config.device.height}`,
      `androidboot.redroid_dpi=${config.device.dpi}`,
      `androidboot.redroid_fps=${config.device.fps}`,
      `androidboot.redroid_gpu_mode=${config.gpuMode}`,
      "androidboot.use_memfd=true",
    ],
    Labels: {
      [LABEL_MANAGED]: "1",
      [LABEL_DEVICE]: spec.deviceId,
      "ce.cpu": String(spec.cpu),
      "ce.ram_mb": String(spec.ramMb),
      "ce.storage_gb": String(spec.storageGb),
      "ce.android": spec.androidVersion,
    },
    HostConfig: {
      Privileged: true, // required by redroid (binder, cgroups)
      Binds: [`${dataDir}:/data`],
      NanoCpus: Math.round(spec.cpu * 1e9),
      Memory: memory,
      MemorySwap: memory, // no swap
      NetworkMode: config.redroidNetwork,
      // Not "unless-stopped": the loop volume must be mounted before start,
      // so the agent restarts desired devices itself on boot (see reconcile.ts).
      RestartPolicy: { Name: "no" },
      LogConfig: { Type: "json-file", Config: { "max-size": "5m", "max-file": "2" } },
    },
  });
  return container.id;
}

export async function startContainer(deviceId: string): Promise<void> {
  const c = docker.getContainer(containerName(deviceId));
  const info = await c.inspect();
  if (!info.State.Running) await c.start();
}

export async function stopContainer(deviceId: string): Promise<void> {
  const info = await getContainer(deviceId);
  if (!info || !info.State.Running) return;
  await docker.getContainer(info.Id).stop({ t: 15 });
}

export async function removeContainer(deviceId: string): Promise<void> {
  const info = await getContainer(deviceId);
  if (!info) return;
  await docker.getContainer(info.Id).remove({ force: true });
}

export async function containerIp(deviceId: string): Promise<string> {
  const info = await getContainer(deviceId);
  if (!info || !info.State.Running) throw new Error("device is not running");
  const ip = info.NetworkSettings.Networks[config.redroidNetwork]?.IPAddress;
  if (!ip) throw new Error("device has no IP on the device network");
  return ip;
}

export async function listManaged(): Promise<Docker.ContainerInfo[]> {
  return docker.listContainers({ all: true, filters: { label: [`${LABEL_MANAGED}=1`] } });
}
