import { spawn } from "node:child_process";

export interface ExecResult {
  code: number;
  stdout: Buffer;
  stderr: string;
}

/** Run a command without a shell. Rejects on non-zero exit unless allowFail. */
export function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; allowFail?: boolean; input?: Buffer } = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    let timer: NodeJS.Timeout | undefined;
    if (opts.timeoutMs) {
      timer = setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs);
    }
    child.stdout.on("data", (d: Buffer) => out.push(d));
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      const res = { code: code ?? -1, stdout: Buffer.concat(out), stderr: err };
      if (res.code !== 0 && !opts.allowFail) {
        reject(new Error(`${cmd} ${args.join(" ")} exited ${res.code}: ${err.trim()}`));
      } else resolve(res);
    });
    if (opts.input) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
