/**
 * Fallback software decoder for browsers without WebCodecs, using Broadway.js
 * (H.264 Baseline only — the stream is requested with baseline=1 in this mode).
 *
 * Broadway is not on npm in a usable form; run `infra/scripts/fetch-broadway.sh`
 * to place Decoder.js + avc.wasm in apps/web/public/broadway/.
 */
import type { MediaPacket } from "@ce/shared/protocol";
import { concat } from "../h264";
import type { FrameSizeListener, VideoRenderer } from "./types";

interface BroadwayDecoder {
  decode(data: Uint8Array): void;
  onPictureDecoded: (buffer: Uint8Array, width: number, height: number) => void;
}
type BroadwayCtor = new (opts: { rgb: boolean }) => BroadwayDecoder;

let scriptPromise: Promise<BroadwayCtor> | null = null;

function loadBroadway(): Promise<BroadwayCtor> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const w = window as unknown as { Decoder?: BroadwayCtor };
    if (w.Decoder) return resolve(w.Decoder);
    const s = document.createElement("script");
    s.src = "/broadway/Decoder.js";
    s.async = true;
    s.onload = () => (w.Decoder ? resolve(w.Decoder) : reject(new Error("Broadway Decoder missing")));
    s.onerror = () => reject(new Error("Could not load /broadway/Decoder.js"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export class BroadwayRenderer implements VideoRenderer {
  readonly kind = "broadway" as const;
  private decoder: BroadwayDecoder | null = null;
  private lastConfig: Uint8Array | null = null;
  private needKey = true;
  private ctx: CanvasRenderingContext2D;
  private image: ImageData | null = null;
  private queue: MediaPacket[] = [];

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onSize: FrameSizeListener,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas not available");
    this.ctx = ctx;
  }

  static create(canvas: HTMLCanvasElement, onSize: FrameSizeListener): BroadwayRenderer {
    const r = new BroadwayRenderer(canvas, onSize);
    loadBroadway()
      .then((Ctor) => {
        r.decoder = new Ctor({ rgb: true });
        r.decoder.onPictureDecoded = (buf, w, h) => r.paint(buf, w, h);
        const q = r.queue;
        r.queue = [];
        q.forEach((p) => r.push(p));
      })
      .catch((e) => console.error("[player] broadway:", e));
    return r;
  }

  push(p: MediaPacket): void {
    if (p.config) {
      this.lastConfig = p.data.slice();
      return;
    }
    if (!this.decoder) {
      if (p.key) this.queue = [p];
      else if (this.queue.length) this.queue.push(p);
      return;
    }
    if (this.needKey && !p.key) return;
    this.needKey = false;
    const data = p.key && this.lastConfig ? concat(this.lastConfig, p.data) : p.data;
    try {
      this.decoder.decode(data);
    } catch {
      this.needKey = true;
    }
  }

  reset(): void {
    this.needKey = true;
    this.lastConfig = null;
    this.queue = [];
  }

  close(): void {
    this.reset();
    this.decoder = null;
  }

  private paint(buf: Uint8Array, w: number, h: number): void {
    if (!this.image || this.image.width !== w || this.image.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.image = this.ctx.createImageData(w, h);
      this.onSize(w, h);
    }
    this.image.data.set(buf.subarray(0, w * h * 4));
    this.ctx.putImageData(this.image, 0, 0);
  }
}
