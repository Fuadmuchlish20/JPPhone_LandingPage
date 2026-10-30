/** Shared domain + API types between web and device-agent. */

export type DeviceStatus =
  | "creating"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "error"
  | "deleted";

export type HostStatus = "online" | "offline" | "draining" | "maintenance";

export type DeviceAction = "start" | "stop" | "restart" | "reset";

export interface DeviceSpec {
  deviceId: string;
  cpu: number;
  ramMb: number;
  storageGb: number;
  androidVersion: string;
}

export interface CreateDeviceRequest extends DeviceSpec {}

export interface CreateDeviceResponse {
  containerId: string;
}

export interface DeviceActionResponse {
  ok: true;
  status: DeviceStatus;
}

export interface HostMetrics {
  cpu_percent: number;
  load_avg: [number, number, number];
  mem_total_mb: number;
  mem_used_mb: number;
  disk_total_gb: number;
  disk_used_gb: number;
  running_containers: number;
  active_sessions: number;
  agent_version: string;
}

export interface HealthResponse extends HostMetrics {
  ok: true;
  host_id: string;
}

export interface AgentError {
  error: string;
  message?: string;
}

/** Claims carried by the short-lived JWT issued by the web app. */
export type TokenScope = "stream" | "apk";

export interface DeviceTokenClaims {
  sub: string; // user id
  did: string; // device id
  hid: string; // host id
  scope: TokenScope;
}

/** Quality options the client may request for a stream session. */
export interface StreamQuality {
  bitRate: number; // bps
  maxFps: number;
  maxSize: number; // longest edge in px, 0 = native
  audio: boolean;
  baseline: boolean; // force H.264 baseline (needed for Broadway fallback)
}

export const QUALITY_LIMITS = {
  bitRate: { min: 500_000, max: 12_000_000, default: 4_000_000 },
  maxFps: { min: 10, max: 60, default: 30 },
  maxSize: { min: 0, max: 1920, default: 1280 },
} as const;

export function clampQuality(q: Partial<StreamQuality>): StreamQuality {
  const clamp = (v: unknown, lim: { min: number; max: number; default: number }) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return lim.default;
    return Math.min(lim.max, Math.max(lim.min, Math.round(n)));
  };
  return {
    bitRate: clamp(q.bitRate, QUALITY_LIMITS.bitRate),
    maxFps: clamp(q.maxFps, QUALITY_LIMITS.maxFps),
    maxSize: clamp(q.maxSize, QUALITY_LIMITS.maxSize),
    audio: q.audio !== false,
    baseline: q.baseline === true,
  };
}
