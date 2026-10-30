import os from "node:os";
import { statfs } from "node:fs/promises";
import type { HostMetrics } from "@ce/shared/types";
import { config } from "../config";
import { docker } from "../docker/containers";
import { activeSessionCount } from "../stream/registry";

let lastCpu = os.cpus().map((c) => c.times);

function cpuPercent(): number {
  const now = os.cpus().map((c) => c.times);
  let idle = 0;
  let total = 0;
  now.forEach((t, i) => {
    const p = lastCpu[i] ?? t;
    const dIdle = t.idle - p.idle;
    const dTotal = t.user + t.nice + t.sys + t.irq + t.idle - (p.user + p.nice + p.sys + p.irq + p.idle);
    idle += dIdle;
    total += dTotal;
  });
  lastCpu = now;
  return total > 0 ? Math.round((1 - idle / total) * 1000) / 10 : 0;
}

export async function collectMetrics(): Promise<HostMetrics> {
  const fs = await statfs(config.devicesDir).catch(() => null);
  const gb = (n: number) => Math.round((n / 1024 ** 3) * 10) / 10;
  const running = await docker
    .listContainers({ filters: { label: ["ce.managed=1"], status: ["running"] } })
    .then((l) => l.length)
    .catch(() => -1);
  const la = os.loadavg();
  return {
    cpu_percent: cpuPercent(),
    load_avg: [la[0] ?? 0, la[1] ?? 0, la[2] ?? 0],
    mem_total_mb: Math.round(os.totalmem() / 1024 ** 2),
    mem_used_mb: Math.round((os.totalmem() - os.freemem()) / 1024 ** 2),
    disk_total_gb: fs ? gb(fs.blocks * fs.bsize) : 0,
    disk_used_gb: fs ? gb((fs.blocks - fs.bfree) * fs.bsize) : 0,
    running_containers: running,
    active_sessions: activeSessionCount(),
    agent_version: config.version,
  };
}
