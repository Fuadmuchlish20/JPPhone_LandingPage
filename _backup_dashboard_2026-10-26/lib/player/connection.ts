/**
 * WebSocket connection to the device host's stream gateway, with token refresh,
 * exponential-backoff reconnect and RTT measurement.
 */
import {
  CloseCode,
  WS_SUBPROTOCOL,
  WS_TOKEN_PREFIX,
  decodeMediaPacket,
  type MediaPacket,
  type ServerMessage,
} from "@ce/shared/protocol";

export type ConnectionState =
  | "connecting"
  | "live"
  | "reconnecting"
  | "replaced" // opened in another tab
  | "unavailable" // device not running
  | "failed"
  | "closed";

export interface StreamParams {
  bitRate: number;
  maxFps: number;
  maxSize: number;
  audio: boolean;
  baseline: boolean;
}

export interface ConnectionCallbacks {
  onState(state: ConnectionState, detail?: string): void;
  onMessage(msg: ServerMessage): void;
  onMedia(packet: MediaPacket): void;
  onLatency(ms: number): void;
  /** called before every (re)connect so decoders can reset */
  onBeforeConnect(): void;
}

const MAX_ATTEMPTS = 10;
const PING_MS = 2000;

export class DeviceConnection {
  private ws: WebSocket | null = null;
  private stopped = false;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly deviceId: string,
    private params: StreamParams,
    private readonly cb: ConnectionCallbacks,
  ) {}

  start(): void {
    this.stopped = false;
    this.attempts = 0;
    void this.open();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    this.ws?.close(CloseCode.Normal, "client closed");
    this.ws = null;
    this.cb.onState("closed");
  }

  /** Apply new quality settings (requires a new scrcpy session on the host). */
  updateParams(p: StreamParams): void {
    this.params = p;
    this.clearTimers();
    const old = this.ws;
    this.ws = null;
    old?.close(CloseCode.Normal, "reconfigure");
    this.attempts = 0;
    this.stopped = false;
    void this.open();
  }

  send(data: Uint8Array): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data);
  }

  private async open(): Promise<void> {
    if (this.stopped) return;
    this.cb.onState(this.attempts === 0 ? "connecting" : "reconnecting");
    this.cb.onBeforeConnect();

    let token: string;
    let wsUrl: string;
    try {
      const res = await fetch(`/api/devices/${this.deviceId}/stream-token`, { method: "POST", cache: "no-store" });
      if (res.status === 409) {
        this.cb.onState("unavailable", "Device is not running.");
        return;
      }
      if (res.status === 401) {
        this.cb.onState("failed", "Your session expired. Please log in again.");
        return;
      }
      if (!res.ok) throw new Error(`token request failed (${res.status})`);
      ({ token, wsUrl } = (await res.json()) as { token: string; wsUrl: string });
    } catch (e) {
      return this.scheduleRetry((e as Error).message);
    }
    if (this.stopped) return;

    const q = new URLSearchParams({
      bitRate: String(this.params.bitRate),
      maxFps: String(this.params.maxFps),
      maxSize: String(this.params.maxSize),
      audio: this.params.audio ? "1" : "0",
      baseline: this.params.baseline ? "1" : "0",
    });
    const ws = new WebSocket(`${wsUrl}?${q}`, [WS_SUBPROTOCOL, WS_TOKEN_PREFIX + token]);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onmessage = (ev) => {
      if (ws !== this.ws) return;
      if (typeof ev.data === "string") {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(ev.data) as ServerMessage;
        } catch {
          return;
        }
        if (msg.type === "ready") {
          this.attempts = 0;
          this.cb.onState("live");
        } else if (msg.type === "pong") {
          this.cb.onLatency(Math.round(performance.now() - msg.t));
        }
        this.cb.onMessage(msg);
      } else {
        this.cb.onMedia(decodeMediaPacket(ev.data as ArrayBuffer));
      }
    };

    ws.onopen = () => {
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping", t: performance.now() }));
      }, PING_MS);
    };

    ws.onclose = (ev) => {
      if (ws !== this.ws) return; // superseded by updateParams()
      this.clearTimers();
      this.ws = null;
      if (this.stopped) return;
      if (ev.code === CloseCode.Replaced) return this.cb.onState("replaced", "This device was opened in another window.");
      if (ev.code === CloseCode.DeviceUnavailable) return this.cb.onState("unavailable", ev.reason || "Device stopped.");
      this.scheduleRetry(ev.reason || `connection closed (${ev.code})`);
    };
  }

  private scheduleRetry(reason: string): void {
    if (this.stopped) return;
    this.attempts++;
    if (this.attempts > MAX_ATTEMPTS) {
      this.cb.onState("failed", reason);
      return;
    }
    const delay = Math.min(10_000, 500 * 2 ** (this.attempts - 1)) + Math.random() * 300;
    this.cb.onState("reconnecting", reason);
    this.retryTimer = setTimeout(() => void this.open(), delay);
  }

  private clearTimers(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.retryTimer = null;
    this.pingTimer = null;
  }
}
