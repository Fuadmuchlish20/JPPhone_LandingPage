import type { MediaPacket } from "@ce/shared/protocol";

const SAMPLE_RATE = 48_000;
const CHANNELS = 2;
const TARGET_LATENCY_S = 0.08;
const MAX_LATENCY_S = 0.35;

export function audioSupported(): boolean {
  return typeof AudioDecoder !== "undefined" && typeof AudioContext !== "undefined";
}

/** Opus (WebCodecs AudioDecoder) → Web Audio, with a small jitter buffer. */
export class OpusAudioPlayer {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private decoder: AudioDecoder | null = null;
  private nextTime = 0;
  private muted = false;

  /** Must be called from a user gesture at least once (autoplay policy). */
  resume(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: "interactive" });
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : 1;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.gain) this.gain.gain.value = m ? 0 : 1;
  }

  push(p: MediaPacket): void {
    if (p.config) {
      this.configure(p.data.slice());
      return;
    }
    if (!this.decoder) this.configure(undefined);
    if (!this.decoder || this.decoder.state !== "configured") return;
    try {
      this.decoder.decode(new EncodedAudioChunk({ type: "key", timestamp: Number(p.pts), data: p.data }));
    } catch {
      this.closeDecoder();
    }
  }

  close(): void {
    this.closeDecoder();
    void this.ctx?.close();
    this.ctx = null;
    this.gain = null;
  }

  private configure(description: Uint8Array | undefined): void {
    this.closeDecoder();
    this.decoder = new AudioDecoder({
      output: (data) => this.play(data),
      error: () => this.closeDecoder(),
    });
    this.decoder.configure({ codec: "opus", sampleRate: SAMPLE_RATE, numberOfChannels: CHANNELS, description });
  }

  private closeDecoder(): void {
    if (this.decoder && this.decoder.state !== "closed") {
      try {
        this.decoder.close();
      } catch {
        /* noop */
      }
    }
    this.decoder = null;
  }

  private play(data: AudioData): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.gain) {
      data.close();
      return;
    }
    const frames = data.numberOfFrames;
    const buffer = ctx.createBuffer(data.numberOfChannels, frames, data.sampleRate);
    for (let ch = 0; ch < data.numberOfChannels; ch++) {
      const plane = new Float32Array(frames);
      data.copyTo(plane, { planeIndex: ch, format: "f32-planar" });
      buffer.copyToChannel(plane, ch);
    }
    data.close();

    const now = ctx.currentTime;
    if (this.nextTime < now || this.nextTime - now > MAX_LATENCY_S) this.nextTime = now + TARGET_LATENCY_S;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain);
    src.start(this.nextTime);
    this.nextTime += buffer.duration;
  }
}
