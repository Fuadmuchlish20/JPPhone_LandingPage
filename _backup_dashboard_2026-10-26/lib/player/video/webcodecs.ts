import type { MediaPacket } from "@ce/shared/protocol";
import { codecStringFromConfig, concat } from "../h264";
import type { FrameSizeListener, VideoRenderer } from "./types";

export async function webCodecsSupported(): Promise<boolean> {
  if (typeof VideoDecoder === "undefined") return false;
  try {
    const r = await VideoDecoder.isConfigSupported({ codec: "avc1.42E01F", optimizeForLatency: true });
    return !!r.supported;
  } catch {
    return false;
  }
}

/** Hardware-accelerated H.264 decode → canvas. Renders only the newest frame per animation frame. */
export class WebCodecsRenderer implements VideoRenderer {
  readonly kind = "webcodecs" as const;
  private decoder: VideoDecoder | null = null;
  private codec: string | null = null;
  private lastConfig: Uint8Array | null = null;
  private needKey = true;
  private pending: VideoFrame | null = null;
  private raf = 0;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onSize: FrameSizeListener,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("2D canvas not available");
    this.ctx = ctx;
  }

  push(p: MediaPacket): void {
    if (p.config) {
      this.lastConfig = p.data.slice();
      const codec = codecStringFromConfig(this.lastConfig);
      if (codec && (codec !== this.codec || !this.decoder)) this.configure(codec);
      return;
    }
    if (!this.decoder || this.decoder.state !== "configured") return;
    if (this.needKey && !p.key) return;

    // SPS/PPS before every key frame: cheap, and lets us recover after drops/resets.
    const data = p.key && this.lastConfig ? concat(this.lastConfig, p.data) : p.data;
    try {
      this.decoder.decode(
        new EncodedVideoChunk({ type: p.key ? "key" : "delta", timestamp: Number(p.pts), data }),
      );
      this.needKey = false;
    } catch {
      this.recover();
    }
  }

  reset(): void {
    this.closeDecoder();
    this.codec = null;
    this.lastConfig = null;
    this.needKey = true;
  }

  close(): void {
    this.reset();
    cancelAnimationFrame(this.raf);
    this.pending?.close();
    this.pending = null;
  }

  private configure(codec: string): void {
    this.closeDecoder();
    this.codec = codec;
    this.needKey = true;
    this.decoder = new VideoDecoder({
      output: (frame) => this.onFrame(frame),
      error: () => this.recover(),
    });
    this.decoder.configure({ codec, optimizeForLatency: true, hardwareAcceleration: "no-preference" });
  }

  private recover(): void {
    const codec = this.codec;
    this.closeDecoder();
    if (codec) this.configure(codec);
  }

  private closeDecoder(): void {
    if (this.decoder && this.decoder.state !== "closed") {
      try {
        this.decoder.close();
      } catch {
        /* already closed */
      }
    }
    this.decoder = null;
  }

  private onFrame(frame: VideoFrame): void {
    this.pending?.close(); // drop stale frame: latency over smoothness
    this.pending = frame;
    if (!this.raf) this.raf = requestAnimationFrame(() => this.draw());
  }

  private draw(): void {
    this.raf = 0;
    const frame = this.pending;
    if (!frame) return;
    this.pending = null;
    const w = frame.displayWidth;
    const h = frame.displayHeight;
    if (w !== this.width || h !== this.height) {
      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.onSize(w, h);
    }
    this.ctx.drawImage(frame, 0, 0, w, h);
    frame.close();
  }
}
