"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Channel } from "@ce/shared/protocol";
import { OpusAudioPlayer, audioSupported } from "@/lib/player/audio";
import { DeviceConnection, type ConnectionState } from "@/lib/player/connection";
import { attachInput } from "@/lib/player/input";
import { createVideoRenderer, pickDecoder, type VideoRenderer } from "@/lib/player/video";
import type { Quality } from "./quality-select";

const QUALITY_KEY = "ce.player.quality";
const DEFAULT_QUALITY: Quality = { bitRate: 4_000_000, maxFps: 30 };
const MAX_SIZE = 1280;
const HIDDEN_DISCONNECT_MS = 60_000;

function loadQuality(): Quality {
  try {
    const raw = localStorage.getItem(QUALITY_KEY);
    if (raw) return { ...DEFAULT_QUALITY, ...(JSON.parse(raw) as Partial<Quality>) };
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_QUALITY;
}

export interface StreamView {
  state: ConnectionState;
  detail?: string;
  latency: number | null;
  audio: "opus" | "disabled" | "error" | "unsupported" | null;
  decoder: "webcodecs" | "broadway" | null;
  quality: Quality;
  muted: boolean;
}

export function useDeviceStream(deviceId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const connRef = useRef<DeviceConnection | null>(null);
  const audioRef = useRef<OpusAudioPlayer | null>(null);
  const frameSize = useRef({ width: 0, height: 0 });
  const stateRef = useRef<ConnectionState>("connecting");
  const decoderRef = useRef<"webcodecs" | "broadway" | null>(null);
  const mutedRef = useRef(false);

  const [view, setView] = useState<StreamView>({
    state: "connecting",
    latency: null,
    audio: null,
    decoder: null,
    quality: DEFAULT_QUALITY,
    muted: false,
  });
  const patch = useCallback((p: Partial<StreamView>) => setView((v) => ({ ...v, ...p })), []);

  const send = useCallback((m: Uint8Array) => connRef.current?.send(m), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let disposed = false;
    let renderer: VideoRenderer | null = null;
    let detachInput: (() => void) | null = null;
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
    const quality = loadQuality();
    patch({ quality });

    void pickDecoder().then((kind) => {
      if (disposed) return;
      renderer = createVideoRenderer(kind, canvas, (width, height) => {
        frameSize.current = { width, height };
      });
      const audio = audioSupported() ? new OpusAudioPlayer() : null;
      audioRef.current = audio;
      decoderRef.current = kind;
      patch({ decoder: kind, audio: audio ? null : "unsupported" });

      const conn = new DeviceConnection(
        deviceId,
        { ...quality, maxSize: MAX_SIZE, audio: !!audio, baseline: kind === "broadway" },
        {
          onState: (state, detail) => {
            stateRef.current = state;
            patch({ state, detail, ...(state !== "live" ? { latency: null } : {}) });
          },
          onLatency: (latency) => patch({ latency }),
          onBeforeConnect: () => renderer?.reset(),
          onMedia: (p) => {
            if (p.channel === Channel.Video) renderer?.push(p);
            else if (p.channel === Channel.Audio) audio?.push(p);
          },
          onMessage: (msg) => {
            if (msg.type === "video-meta" && !frameSize.current.width) {
              frameSize.current = { width: msg.width, height: msg.height };
            } else if (msg.type === "audio-meta") {
              patch({ audio: msg.codec });
            } else if (msg.type === "clipboard") {
              navigator.clipboard?.writeText(msg.text).catch(() => undefined);
            } else if (msg.type === "error") {
              patch({ detail: msg.message });
            }
          },
        },
      );
      connRef.current = conn;
      conn.start();

      detachInput = attachInput({
        canvas,
        focusTarget: stage,
        getFrameSize: () => frameSize.current,
        send: (m) => conn.send(m),
        onUserGesture: () => audio?.resume(),
      });
      stage.focus({ preventScroll: true });
    });

    // Save bandwidth when the tab is hidden for a while. The device keeps running.
    const onVisibility = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(() => connRef.current?.stop(), HIDDEN_DISCONNECT_MS);
      } else {
        if (hiddenTimer) clearTimeout(hiddenTimer);
        hiddenTimer = null;
        if (stateRef.current === "closed") connRef.current?.start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (hiddenTimer) clearTimeout(hiddenTimer);
      detachInput?.();
      connRef.current?.stop();
      connRef.current = null;
      renderer?.close();
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, [deviceId, patch]);

  // Device restarting/stopped: poll until it is running again.
  useEffect(() => {
    if (view.state !== "unavailable") return;
    const t = setTimeout(() => connRef.current?.start(), 5000);
    return () => clearTimeout(t);
  }, [view.state, view.detail]);

  const setQuality = useCallback(
    (q: Quality) => {
      try {
        localStorage.setItem(QUALITY_KEY, JSON.stringify(q));
      } catch {
        /* ignore */
      }
      patch({ quality: q });
      connRef.current?.updateParams({
        ...q,
        maxSize: MAX_SIZE,
        audio: !!audioRef.current,
        baseline: decoderRef.current === "broadway",
      });
    },
    [patch],
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.resume();
    mutedRef.current = !mutedRef.current;
    audio.setMuted(mutedRef.current);
    patch({ muted: mutedRef.current });
  }, [patch]);

  const reconnect = useCallback(() => connRef.current?.start(), []);

  const fullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
    stage.focus();
  }, []);

  return { canvasRef, stageRef, view, send, setQuality, toggleMute, reconnect, fullscreen };
}
