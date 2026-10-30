/** Thin wrapper over the adb CLI. Devices are reached over the private docker bridge only. */
import { spawn, type ChildProcess } from "node:child_process";
import { log } from "../log";
import { run, sleep } from "../util/exec";

const ADB = process.env.ADB_PATH || "adb";

export function serialFor(ip: string): string {
  return `${ip}:5555`;
}

export async function startServer(): Promise<void> {
  await run(ADB, ["start-server"], { timeoutMs: 15_000 });
}

export async function connect(serial: string): Promise<boolean> {
  const r = await run(ADB, ["connect", serial], { allowFail: true, timeoutMs: 10_000 });
  const out = r.stdout.toString();
  return /connected to/.test(out);
}

export async function disconnect(serial: string): Promise<void> {
  await run(ADB, ["disconnect", serial], { allowFail: true, timeoutMs: 5_000 });
}

export async function shell(serial: string, cmd: string, timeoutMs = 20_000): Promise<string> {
  const r = await run(ADB, ["-s", serial, "shell", cmd], { timeoutMs });
  return r.stdout.toString().trim();
}

export async function isBooted(serial: string): Promise<boolean> {
  if (!(await connect(serial))) return false;
  const r = await run(ADB, ["-s", serial, "shell", "getprop", "sys.boot_completed"], {
    allowFail: true,
    timeoutMs: 5_000,
  });
  return r.code === 0 && r.stdout.toString().trim() === "1";
}

export async function waitForBoot(serial: string, timeoutMs = 240_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isBooted(serial)) return;
    await sleep(2_000);
  }
  throw new Error(`device ${serial} did not finish booting in ${timeoutMs / 1000}s`);
}

export async function push(serial: string, local: string, remote: string): Promise<void> {
  await run(ADB, ["-s", serial, "push", local, remote], { timeoutMs: 60_000 });
}

/** Forward a free local TCP port to a device abstract socket. Returns the local port. */
export async function forward(serial: string, remote: string): Promise<number> {
  const r = await run(ADB, ["-s", serial, "forward", "tcp:0", remote], { timeoutMs: 10_000 });
  const port = Number(r.stdout.toString().trim());
  if (!Number.isInteger(port) || port <= 0) throw new Error(`adb forward returned "${r.stdout}"`);
  return port;
}

export async function removeForward(serial: string, port: number): Promise<void> {
  await run(ADB, ["-s", serial, "forward", "--remove", `tcp:${port}`], { allowFail: true, timeoutMs: 5_000 });
}

export async function screencap(serial: string): Promise<Buffer> {
  const r = await run(ADB, ["-s", serial, "exec-out", "screencap", "-p"], { timeoutMs: 15_000 });
  return r.stdout;
}

export async function install(serial: string, apkPath: string): Promise<string> {
  const r = await run(ADB, ["-s", serial, "install", "-r", "-g", apkPath], {
    timeoutMs: 5 * 60_000,
    allowFail: true,
  });
  const out = (r.stdout.toString() + r.stderr).trim();
  if (r.code !== 0 || !/Success/.test(out)) throw new Error(out || `adb install exited ${r.code}`);
  return out;
}

/** Long-running `adb shell <cmd>`; caller owns the process lifecycle. */
export function spawnShell(serial: string, cmd: string): ChildProcess {
  const child = spawn(ADB, ["-s", serial, "shell", cmd], { stdio: ["ignore", "pipe", "pipe"] });
  child.stdout?.on("data", (d: Buffer) => log.debug("scrcpy-server", { serial, out: d.toString().trim() }));
  child.stderr?.on("data", (d: Buffer) => log.debug("scrcpy-server", { serial, err: d.toString().trim() }));
  return child;
}
