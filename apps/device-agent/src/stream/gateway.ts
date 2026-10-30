/**
 * WebSocket stream gateway: wss://<host>/stream/<deviceId>?bitRate=&maxFps=&maxSize=&audio=&baseline=
 * Auth: subprotocols ["ce.v1", "token.<jwt>"] (keeps the token out of URLs/logs).
 */
import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket, type RawData } from "ws";
import { verifyDeviceToken } from "@ce/shared/jwt";
import {
  ALLOWED_CONTROL_TYPES,
  Channel,
  CloseCode,
  WS_SUBPROTOCOL,
  WS_TOKEN_PREFIX,
  encodeMediaPacket,
  type ClientMessage,
  type ServerMessage,
} from "@ce/shared/protocol";
import { clampQuality } from "@ce/shared/types";
import * as adb from "../adb/adb";
import { config } from "../config";
import { containerIp } from "../docker/containers";
import { errMsg, log } from "../log";
import { audit, getDevice, touchDevice } from "../supabase";
import { clearSession, getSession, setSession, type ActiveSession } from "./registry";
import { ScrcpySession } from "./scrcpy-session";

const PATH_RE = /^\/stream\/([0-9a-f-]{36})$/;
const MAX_BUFFERED_BYTES = 4 * 1024 * 1024;
const ACTIVITY_TOUCH_MS = 60_000;

interface Authed {
  deviceId: string;
  userId: string;
  androidVersion: string;
}

function reject(socket: Duplex, status: number, msg: string) {
  socket.write(`HTTP/1.1 ${status} ${msg}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function clientIp(req: IncomingMessage): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  return (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() || req.socket.remoteAddress;
}

async function authenticate(req: IncomingMessage, deviceId: string): Promise<Authed> {
  const origin = req.headers.origin;
  if (origin && origin !== config.webOrigin) throw new Error("bad origin");

  const protocols = String(req.headers["sec-websocket-protocol"] ?? "")
    .split(",")
    .map((p) => p.trim());
  if (!protocols.includes(WS_SUBPROTOCOL)) throw new Error("missing subprotocol");
  const token = protocols.find((p) => p.startsWith(WS_TOKEN_PREFIX))?.slice(WS_TOKEN_PREFIX.length);
  if (!token) throw new Error("missing token");

  const claims = await verifyDeviceToken(config.jwtSecret, token, {
    scope: "stream",
    hostId: config.hostId,
    deviceId,
  });
  const row = await getDevice(deviceId);
  if (!row || row.user_id !== claims.sub) throw new Error("device not found");
  if (row.status !== "running") throw new Error(`device is ${row.status}`);
  return { deviceId, userId: claims.sub, androidVersion: row.android_version };
}

export function attachGateway(server: Server): void {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 512 * 1024,
    perMessageDeflate: false, // H.264 doesn't compress; saves CPU
    handleProtocols: (protocols) => (protocols.has(WS_SUBPROTOCOL) ? WS_SUBPROTOCOL : false),
  });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const m = PATH_RE.exec(url.pathname);
    if (!m) return reject(socket, 404, "Not Found");
    const deviceId = m[1]!;

    authenticate(req, deviceId)
      .then((auth) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          void handleConnection(ws, req, auth, url.searchParams);
        });
      })
      .catch((e) => {
        log.warn("stream auth rejected", { deviceId, err: errMsg(e) });
        reject(socket, 401, "Unauthorized");
      });
  });
}

async function handleConnection(ws: WebSocket, req: IncomingMessage, auth: Authed, params: URLSearchParams) {
  const { deviceId, userId } = auth;
  const quality = clampQuality({
    bitRate: Number(params.get("bitRate")),
    maxFps: Number(params.get("maxFps")),
    maxSize: params.has("maxSize") ? Number(params.get("maxSize")) : undefined,
    // scrcpy can only capture audio on Android 11+
    audio: params.get("audio") !== "0" && Number(auth.androidVersion) >= 11,
    baseline: params.get("baseline") === "1",
  });

  const send = (m: ServerMessage) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m));
  };

  let scrcpy: ScrcpySession | null = null;
  let needKeyFrame = false;
  const session: ActiveSession = {
    deviceId,
    userId,
    startedAt: Date.now(),
    close: (code, reason) => {
      scrcpy?.close(reason);
      if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) ws.close(code, reason);
    },
  };

  // one viewer per device: kick the previous session
  getSession(deviceId)?.close(CloseCode.Replaced, "opened in another session");
  setSession(session);

  const activity = setInterval(() => void touchDevice(deviceId), ACTIVITY_TOUCH_MS);
  void touchDevice(deviceId);
  void audit(deviceId, userId, "stream_start", { quality }, clientIp(req), req.headers["user-agent"]);

  ws.on("close", () => {
    clearInterval(activity);
    scrcpy?.close("client disconnected");
    clearSession(deviceId, session);
    void touchDevice(deviceId);
    void audit(deviceId, userId, "stream_end", { seconds: Math.round((Date.now() - session.startedAt) / 1000) });
  });

  ws.on("message", (data: RawData, isBinary: boolean) => {
    const buf = Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as Buffer);
    if (isBinary) {
      if (buf.length === 0 || !ALLOWED_CONTROL_TYPES.has(buf[0]!)) return;
      scrcpy?.sendControl(buf);
      return;
    }
    try {
      const msg = JSON.parse(buf.toString("utf8")) as ClientMessage;
      if (msg.type === "ping") send({ type: "pong", t: msg.t });
    } catch {
      /* ignore malformed */
    }
  });

  try {
    const serial = adb.serialFor(await containerIp(deviceId));
    if (!(await adb.connect(serial))) throw new Error("adb connect failed");

    scrcpy = new ScrcpySession(serial, quality, {
      onVideoMeta: (width, height) => send({ type: "video-meta", codec: "h264", width, height }),
      onVideoPacket: (isConfig, key, pts, data) => {
        if (ws.readyState !== ws.OPEN) return;
        if (!isConfig) {
          // backpressure: drop delta frames until the next key frame
          if (ws.bufferedAmount > MAX_BUFFERED_BYTES) needKeyFrame = true;
          if (needKeyFrame && !key) return;
          if (key) needKeyFrame = false;
        }
        ws.send(encodeMediaPacket(Channel.Video, isConfig, key, pts, data));
      },
      onAudioMeta: (codec) => send({ type: "audio-meta", codec }),
      onAudioPacket: (isConfig, key, pts, data) => {
        if (ws.readyState !== ws.OPEN) return;
        if (!isConfig && ws.bufferedAmount > MAX_BUFFERED_BYTES) return;
        ws.send(encodeMediaPacket(Channel.Audio, isConfig, key, pts, data));
      },
      onClipboard: (text) => send({ type: "clipboard", text }),
      onClose: (reason) => {
        if (ws.readyState === ws.OPEN) ws.close(CloseCode.StreamEnded, reason.slice(0, 120));
      },
    });
    await scrcpy.start();
    if (ws.readyState !== ws.OPEN) {
      scrcpy.close("client left during startup");
      return;
    }
    send({ type: "ready" });
    log.info("stream started", { deviceId, quality });
  } catch (e) {
    log.error("stream start failed", { deviceId, err: errMsg(e) });
    send({ type: "error", message: errMsg(e) });
    if (ws.readyState === ws.OPEN) ws.close(CloseCode.Internal, "stream start failed");
  }
}
