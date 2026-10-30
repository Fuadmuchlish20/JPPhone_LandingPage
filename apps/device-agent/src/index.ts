import { createServer } from "node:http";
import * as adb from "./adb/adb";
import { config } from "./config";
import { ensureImage } from "./docker/containers";
import { handleRequest } from "./http/routes";
import { errMsg, log } from "./log";
import { collectMetrics } from "./metrics/host-metrics";
import { reconcileOnBoot, reconcileTick } from "./reconcile";
import { attachGateway } from "./stream/gateway";
import { reportHeartbeat } from "./supabase";

async function heartbeat(): Promise<void> {
  try {
    await reportHeartbeat(await collectMetrics());
    await reconcileTick();
  } catch (e) {
    log.error("heartbeat failed", { err: errMsg(e) });
  }
}

async function main(): Promise<void> {
  log.info("device-agent starting", { hostId: config.hostId, version: config.version });
  await adb.startServer();

  const server = createServer((req, res) => void handleRequest(req, res));
  server.requestTimeout = 10 * 60_000; // APK uploads
  server.headersTimeout = 30_000;
  attachGateway(server);
  await new Promise<void>((resolve) => server.listen(config.listenPort, config.listenHost, resolve));
  log.info("listening", { host: config.listenHost, port: config.listenPort });

  // Pre-pull (one at a time) so the first device creation doesn't block on a multi-GB download.
  void (async () => {
    for (const image of new Set(Object.values(config.redroidImages))) {
      await ensureImage(image).catch((e) => log.error("image pull failed", { image, err: errMsg(e) }));
    }
  })();

  await reconcileOnBoot().catch((e) => log.error("reconcile on boot failed", { err: errMsg(e) }));
  await heartbeat();
  const timer = setInterval(() => void heartbeat(), config.heartbeatIntervalMs);

  // Devices keep running when the agent stops/updates; only the agent goes away.
  const shutdown = (sig: string) => {
    log.info("shutting down agent (devices keep running)", { sig });
    clearInterval(timer);
    server.close();
    setTimeout(() => process.exit(0), 2_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (e) => log.error("unhandled rejection", { err: errMsg(e) }));

main().catch((e) => {
  log.error("fatal", { err: errMsg(e) });
  process.exit(1);
});
