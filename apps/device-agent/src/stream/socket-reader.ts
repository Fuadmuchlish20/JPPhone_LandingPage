import type { Socket } from "node:net";

/** Promise-based exact-length reader over a net.Socket. */
export class SocketReader {
  private chunks: Buffer[] = [];
  private length = 0;
  private waiter: { n: number; resolve: (b: Buffer) => void; reject: (e: Error) => void } | null = null;
  private closedError: Error | null = null;

  constructor(socket: Socket) {
    socket.on("data", (d: Buffer) => {
      this.chunks.push(d);
      this.length += d.length;
      this.flush();
    });
    const onClose = (e?: Error) => {
      if (!this.closedError) this.closedError = e ?? new Error("socket closed");
      this.flush();
    };
    socket.on("end", () => onClose());
    socket.on("close", () => onClose());
    socket.on("error", (e) => onClose(e));
  }

  read(n: number): Promise<Buffer> {
    if (this.waiter) return Promise.reject(new Error("concurrent read"));
    return new Promise((resolve, reject) => {
      this.waiter = { n, resolve, reject };
      this.flush();
    });
  }

  private flush(): void {
    const w = this.waiter;
    if (!w) return;
    if (this.length >= w.n) {
      this.waiter = null;
      w.resolve(this.take(w.n));
    } else if (this.closedError) {
      this.waiter = null;
      w.reject(this.closedError);
    }
  }

  private take(n: number): Buffer {
    const all = this.chunks.length === 1 ? this.chunks[0]! : Buffer.concat(this.chunks, this.length);
    const out = all.subarray(0, n);
    const rest = all.subarray(n);
    this.chunks = rest.length ? [rest] : [];
    this.length = rest.length;
    // copy so the returned slice does not pin the larger buffer
    return Buffer.from(out);
  }
}
