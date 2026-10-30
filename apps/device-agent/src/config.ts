function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function opt(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/** "10=img:tag,13=img:tag" -> { "10": "img:tag", "13": "img:tag" } */
function imageMap(name: string, fallback: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of opt(name, fallback).split(",")) {
    const [version, image] = pair.split("=").map((s) => s.trim());
    if (!version || !image || !/^d{1,2}$/.test(version)) throw new Error(`Invalid ${name} entry "${pair}"`);
    out[version] = image;
  }
  return out;
}

function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && process.env[name] !== "" ? v : fallback;
}

export const config = {
  version: "0.1.0",
  hostId: req("HOST_ID"),
  hmacSecret: req("AGENT_HMAC_SECRET"),
  jwtSecret: req("STREAM_JWT_SECRET"),
  supabaseUrl: req("SUPABASE_URL"),
  supabaseServiceKey: req("SUPABASE_SERVICE_ROLE_KEY"),
  listenHost: opt("AGENT_LISTEN_HOST", "127.0.0.1"),
  listenPort: num("AGENT_LISTEN_PORT", 8080),
  webOrigin: opt("WEB_ORIGIN", "https://claudeemulator.net"),
  // Android version -> Redroid image. REDROID_IMAGE (legacy, single image) is used for "13" when REDROID_IMAGES is unset.
  redroidImages: imageMap(
    "REDROID_IMAGES",
    [
      "10=redroid/redroid:10.0.0-latest",
      "12=redroid/redroid:12.0.0-latest",
      `13=${opt("REDROID_IMAGE", "redroid/redroid:13.0.0-latest")}`,
      "15=redroid/redroid:15.0.0_64only-latest",
    ].join(","),
  ),
  redroidNetwork: opt("REDROID_NETWORK", "redroid-net"),
  gpuMode: opt("REDROID_GPU_MODE", "guest") as "guest" | "host",
  device: {
    width: num("DEVICE_WIDTH", 720),
    height: num("DEVICE_HEIGHT", 1280),
    dpi: num("DEVICE_DPI", 320),
    fps: num("DEVICE_FPS", 30),
  },
  storageMode: opt("STORAGE_MODE", "loop") as "loop" | "dir",
  devicesDir: opt("DEVICES_DIR", "/data/devices"),
  scrcpyVersion: opt("SCRCPY_VERSION", "3.3.1"),
  scrcpyServerPath: opt("SCRCPY_SERVER_PATH", "/opt/scrcpy/scrcpy-server.jar"),
  heartbeatIntervalMs: num("HEARTBEAT_INTERVAL_MS", 30_000),
  apkMaxBytes: num("APK_MAX_MB", 500) * 1024 * 1024,
  logLevel: opt("LOG_LEVEL", "info"),
} as const;

export type Config = typeof config;
