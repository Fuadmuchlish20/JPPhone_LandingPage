import type { MediaPacket } from "@ce/shared/protocol";

export interface VideoRenderer {
  readonly kind: "webcodecs" | "broadway";
  /** Feed one packet from the stream (config or frame). */
  push(packet: MediaPacket): void;
  /** Drop decoder state (e.g. before reconnecting). */
  reset(): void;
  close(): void;
}

/** Called whenever the decoded frame size changes (device rotation, new session). */
export type FrameSizeListener = (width: number, height: number) => void;
