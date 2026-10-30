import "server-only";
import { signRequest } from "@ce/shared/hmac";
import type {
  CreateDeviceRequest,
  CreateDeviceResponse,
  DeviceAction,
  DeviceActionResponse,
  HealthResponse,
} from "@ce/shared/types";
import { serverEnv } from "../env";

export class AgentError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface HostRef {
  public_url: string;
}

async function call(host: HostRef, method: string, path: string, body?: unknown, timeoutMs = 60_000): Promise<Response> {
  const payload = body === undefined ? "" : JSON.stringify(body);
  const headers: Record<string, string> = signRequest(serverEnv.agentHmacSecret, method, path, payload);
  if (payload) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(new URL(path, host.public_url), {
      method,
      headers,
      body: payload || undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new AgentError(503, "host_unreachable", `Device host unreachable: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new AgentError(res.status, err.error ?? "agent_error", err.message ?? `Agent returned ${res.status}`);
  }
  return res;
}

export const agent = {
  async health(host: HostRef): Promise<HealthResponse> {
    return (await call(host, "GET", "/api/health", undefined, 10_000)).json();
  },
  async createDevice(host: HostRef, req: CreateDeviceRequest): Promise<CreateDeviceResponse> {
    return (await call(host, "POST", "/api/devices", req, 120_000)).json();
  },
  async action(host: HostRef, deviceId: string, action: DeviceAction): Promise<DeviceActionResponse> {
    return (await call(host, "POST", `/api/devices/${deviceId}/${action}`, undefined, 120_000)).json();
  },
  async remove(host: HostRef, deviceId: string): Promise<void> {
    await call(host, "DELETE", `/api/devices/${deviceId}`, undefined, 120_000);
  },
  async screenshot(host: HostRef, deviceId: string): Promise<ArrayBuffer> {
    return (await call(host, "GET", `/api/devices/${deviceId}/screenshot`, undefined, 20_000)).arrayBuffer();
  },
};

export function wsBaseUrl(publicUrl: string): string {
  return publicUrl.replace(/^http/, "ws").replace(/\/$/, "");
}
