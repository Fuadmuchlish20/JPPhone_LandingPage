import { BroadwayRenderer } from "./broadway";
import type { FrameSizeListener, VideoRenderer } from "./types";
import { WebCodecsRenderer, webCodecsSupported } from "./webcodecs";

export type { VideoRenderer, FrameSizeListener } from "./types";

export async function pickDecoder(): Promise<"webcodecs" | "broadway"> {
  return (await webCodecsSupported()) ? "webcodecs" : "broadway";
}

export function createVideoRenderer(
  kind: "webcodecs" | "broadway",
  canvas: HTMLCanvasElement,
  onSize: FrameSizeListener,
): VideoRenderer {
  return kind === "webcodecs" ? new WebCodecsRenderer(canvas, onSize) : BroadwayRenderer.create(canvas, onSize);
}
