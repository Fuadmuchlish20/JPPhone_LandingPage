import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  CreateDeviceRequest,
  CreateDeviceResponse,
  DeviceAction,
  DeviceActionResponse,
  HealthResponse,
} from "@ce/shared/types";
import { verifyDeviceToken } from "@ce/shared/jwt";
import * as adb from "../adb/adb";
import { config } from "../config";
import * as service from "../devices/service";
import { containerIp } from "../docker/containers";
import { errMsg, log } from "../log";
import { collectMetrics } from "../metrics/host-metrics";
import { assertDeviceId } from "../storage/volumes";
import { audit, getDevice } from "../supabase";
import { receiveApk } from "./apk-upload";
import { HttpError, bearer, requireHmac, sendJson, setCors } from "./util";

const ACTIONS = new Set<DeviceAction>(["start", "stop", "restart", "reset"]);

type Handler = (req: IncomingMessage, res: ServerResponse, params: string[], pathname: string) => Promise<void>;

interface Route {
  method: string;
  re: RegExp;
  handler: Handler;
}

const ID = "([0-9a-f-]{36})";

const routes: Route[] = [
  {
    method: "GET",
    re: /^\/api\/health$/,
    handler: async (req, res, _p, pathname) => {
      await requireHmac(req, pathname);
      const body: HealthResponse = { ok: true, host_id: config.hostId, ...(await collectMetrics()) };
      sendJson(res, 200, body);
    },
  },
  {
    method: "POST",
    re: /^\/api\/devices$/,
    handler: async (req, res, _p, pathname) => {
      const body = await requireHmac<CreateDeviceRequest>(req, pathname);
      assertDeviceId(body.deviceId);
      const spec = {
        deviceId: body.deviceId,
        cpu: Number(body.cpu),
        ramMb: Number(body.ramMb),
        storageGb: Number(body.storageGb),
        androidVersion: String(body.androidVersion ?? "13"),
      };
      if (!(spec.cpu > 0 && spec.ramMb >= 1024 && spec.storageGb >= 4)) throw new HttpError(400, "invalid_spec");
      if (!config.redroidImages[spec.androidVersion]) throw new HttpError(400, "unsupported_android_version");
      const containerId = await service.createDevice(spec);
      const out: CreateDeviceResponse = { containerId };
      sendJson(res, 202, out);
    },
  },
  {
    method: "POST",
    re: new RegExp(`^/api/devices/${ID}/(start|stop|restart|reset)$`),
    handler: async (req, res, [id, action], pathname) => {
      await requireHmac(req, pathname);
      if (!ACTIONS.has(action as DeviceAction)) throw new HttpError(400, "bad_action");
      const status = await service.runAction(id!, action as DeviceAction);
      const out: DeviceActionResponse = { ok: true, status };
      sendJson(res, 200, out);
    },
  },
  {
    method: "DELETE",
    re: new RegExp(`^/api/devices/${ID}$`),
    handler: async (req, res, [id], pathname) => {
      await requireHmac(req, pathname);
      await service.deleteDevice(id!);
      sendJson(res, 200, { ok: true });
    },
  },
  {
    method: "GET",
    re: new RegExp(`^/api/devices/${ID}/screenshot$`),
    handler: async (req, res, [id], pathname) => {
      await requireHmac(req, pathname);
      const png = await adb.screencap(adb.serialFor(await containerIp(id!)));
      res.writeHead(200, { "content-type": "image/png", "content-length": png.length, "cache-control": "no-store" });
      res.end(png);
    },
  },
  {
    method: "OPTIONS",
    re: new RegExp(`^/api/devices/${ID}/install-apk$`),
    handler: async (req, res) => {
      setCors(req, res);
      res.writeHead(204).end();
    },
  },
  {
    method: "POST",
    re: new RegExp(`^/api/devices/${ID}/install-apk$`),
    handler: async (req, res, [id]) => {
      setCors(req, res);
      const token = bearer(req);
      if (!token) throw new HttpError(401, "unauthorized");
      const claims = await verifyDeviceToken(config.jwtSecret, token, {
        scope: "apk",
        hostId: config.hostId,
        deviceId: id!,
      }).catch(() => {
        throw new HttpError(401, "unauthorized");
      });
      const row = await getDevice(id!);
      if (!row || row.user_id !== claims.sub) throw new HttpError(404, "not_found");
      if (row.status !== "running") throw new HttpError(409, "device_not_running");

      const upload = await receiveApk(req);
      try {
        const out = await adb.install(adb.serialFor(await containerIp(id!)), upload.file);
        void audit(id!, claims.sub, "apk_install", { name: upload.name });
        sendJson(res, 200, { ok: true, message: out });
      } catch (e) {
        throw new HttpError(422, "install_failed", errMsg(e));
      } finally {
        await upload.cleanup();
      }
    },
  },
];

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  try {
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(url.pathname);
      if (m) return await r.handler(req, res, m.slice(1), url.pathname);
    }
    throw new HttpError(404, "not_found");
  } catch (e) {
    if (res.headersSent) return void res.destroy();
    if (e instanceof HttpError) {
      sendJson(res, e.status, { error: e.code, message: e.message });
    } else {
      log.error("request failed", { path: url.pathname, err: errMsg(e) });
      sendJson(res, 500, { error: "internal", message: errMsg(e) });
    }
  }
}
