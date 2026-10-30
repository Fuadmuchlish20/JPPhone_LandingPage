/**
 * One scrcpy-server instance on a device (scrcpy protocol v3.x, tunnel_forward mode).
 * Sockets are accepted in order: video, audio (if enabled), control.
 */
import { randomInt } from "node:crypto";
import { connect as netConnect, type Socket } from "node:net";
import type { ChildProcess } from "node:child_process";
import type { StreamQuality } from "@ce/shared/types";
import { DeviceMessageType } from "@ce/shared/protocol";
import * as adb from "../adb/adb";
import { config } from "../config";
import { errMsg, log } from "../log";
import { sleep } from "../util/exec";
import { SocketReader } from "./socket-reader";

const REMOTE_JAR = "/data/local/tmp/scrcpy-server.jar";
const CODEC_H264 = 0x68323634; // "h264"
const CODEC_OPUS = 0x6f707573; // "opus"
const PTS_CONFIG = 1n << 63n;
const PTS_KEY = 1n << 62n;
const PTS_MASK = PTS_KEY - 1n;

export interface ScrcpyHandlers {
  onVideoMeta(width: number, height: number): void;
  onVideoPacket(config: boolean, key: boolean, pts: bigint, data: Buffer): void;
  onAudioMeta(codec: "opus" | "disabled" | "error"): void;
  onAudioPacket(config: boolean, key: boolean, pts: bigint, data: Buffer): void;
  onClipboard(text: string): void;
  onClose(reason: string): void;
}

export class ScrcpySession {
  private server: ChildProcess | null = null;
  private sockets: Socket[] = [];
  private control: Socket | null = null;
  private port = 0;
  private closed = false;

  constructor(
    private readonly serial: string,
    private readonly quality: StreamQuality,
    private readonly handlers: ScrcpyHandlers,
  ) {}

  async start(): Promise<void> {
    const scid = randomInt(1, 0x7fffffff).toString(16).padStart(8, "0");
    await adb.push(this.serial, config.scrcpyServerPath, REMOTE_JAR);
    this.port = await adb.forward(this.serial, `localabstract:scrcpy_${scid}`);

    const q = this.quality;
    const codecOptions = ["i-frame-interval:int=2"];
    if (q.baseline) codecOptions.unshift("profile:int=1"); // AVCProfileBaseline
    const args = [
      config.scrcpyVersion,
      `scid=${scid}`,
      "log_level=info",
      "tunnel_forward=true",
      "video=true",
      "video_codec=h264",
      `video_bit_rate=${q.bitRate}`,
      `max_fps=${q.maxFps}`,
      `max_size=${q.maxSize}`,
      `video_codec_options=${codecOptions.join(",")}`,
      `audio=${q.audio}`,
      "audio_codec=opus",
      "control=true",
      "clipboard_autosync=true",
      "send_device_meta=false",
      "send_dummy_byte=true",
      "send_codec_meta=true",
      "send_frame_meta=true",
      "cleanup=true",
    ];
    const cmd = `CLASSPATH=${REMOTE_JAR} app_process / com.genymobile.scrcpy.Server ${args.join(" ")}`;
    this.server = adb.spawnShell(this.serial, cmd);
    this.server.on("exit", (code) => this.close(`scrcpy-server exited (${code})`));

    try {
      const video = await this.connectFirst();
      const audio = q.audio ? await this.connectNext() : null;
      const control = await this.connectNext();
      this.control = control;

      void this.readVideo(video.reader);
      if (audio) void this.readAudio(new SocketReader(audio));
      void this.readDeviceMessages(new SocketReader(control));
    } catch (e) {
      this.close(`connect failed: ${errMsg(e)}`);
      throw e;
    }
  }

  sendControl(msg: Buffer): void {
    if (this.control && !this.control.destroyed) this.control.write(msg);
  }

  close(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    for (const s of this.sockets) s.destroy();
    this.server?.kill("SIGKILL");
    if (this.port) void adb.removeForward(this.serial, this.port);
    log.info("scrcpy session closed", { serial: this.serial, reason });
    this.handlers.onClose(reason);
  }

  /* ---------------- connection ---------------- */

  private openSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const s = netConnect({ host: "127.0.0.1", port: this.port });
      s.setNoDelay(true);
      s.once("connect", () => resolve(s));
      s.once("error", reject);
    });
  }

  /** The first socket receives a dummy byte once the server is really listening. */
  private async connectFirst(): Promise<{ socket: Socket; reader: SocketReader }> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline && !this.closed) {
      let s: Socket | null = null;
      try {
        s = await this.openSocket();
        const reader = new SocketReader(s);
        const dummy = await Promise.race([
          reader.read(1).catch(() => null),
          sleep(2_000).then(() => null),
        ]);
        if (dummy) {
          // keep the same reader: bytes after the dummy byte may already be buffered
          this.track(s);
          return { socket: s, reader };
        }
      } catch {
        /* server not listening yet */
      }
      s?.destroy();
      await sleep(150);
    }
    throw new Error("timed out connecting to scrcpy-server");
  }

  private async connectNext(): Promise<Socket> {
    const s = await this.openSocket();
    this.track(s);
    return s;
  }

  private track(s: Socket): void {
    this.sockets.push(s);
    s.on("close", () => this.close("socket closed"));
    s.on("error", () => undefined);
  }

  /* ---------------- readers ---------------- */

  private async readVideo(r: SocketReader): Promise<void> {
    try {
      const meta = await r.read(12);
      const codec = meta.readUInt32BE(0);
      if (codec !== CODEC_H264) throw new Error(`unexpected video codec 0x${codec.toString(16)}`);
      this.handlers.onVideoMeta(meta.readUInt32BE(4), meta.readUInt32BE(8));
      for (;;) {
        const { config: isConfig, key, pts, size } = this.parseHeader(await r.read(12));
        this.handlers.onVideoPacket(isConfig, key, pts, await r.read(size));
      }
    } catch (e) {
      this.close(`video: ${errMsg(e)}`);
    }
  }

  private async readAudio(r: SocketReader): Promise<void> {
    try {
      const codec = (await r.read(4)).readUInt32BE(0);
      if (codec === 0) return this.handlers.onAudioMeta("disabled");
      if (codec === 1) return this.handlers.onAudioMeta("error");
      if (codec !== CODEC_OPUS) throw new Error(`unexpected audio codec 0x${codec.toString(16)}`);
      this.handlers.onAudioMeta("opus");
      for (;;) {
        const { config: isConfig, key, pts, size } = this.parseHeader(await r.read(12));
        this.handlers.onAudioPacket(isConfig, key, pts, await r.read(size));
      }
    } catch (e) {
      // audio failure must not kill the session
      if (!this.closed) log.warn("audio stream ended", { serial: this.serial, err: errMsg(e) });
    }
  }

  private async readDeviceMessages(r: SocketReader): Promise<void> {
    try {
      for (;;) {
        const type = (await r.read(1)).readUInt8(0);
        switch (type) {
          case DeviceMessageType.Clipboard: {
            const len = (await r.read(4)).readUInt32BE(0);
            this.handlers.onClipboard((await r.read(len)).toString("utf8"));
            break;
          }
          case DeviceMessageType.AckClipboard:
            await r.read(8);
            break;
          case DeviceMessageType.UhidOutput: {
            await r.read(2);
            const size = (await r.read(2)).readUInt16BE(0);
            await r.read(size);
            break;
          }
          default:
            throw new Error(`unknown device message type ${type}`);
        }
      }
    } catch (e) {
      if (!this.closed) log.warn("control stream ended", { serial: this.serial, err: errMsg(e) });
    }
  }

  private parseHeader(h: Buffer) {
    const raw = h.readBigUInt64BE(0);
    return {
      config: (raw & PTS_CONFIG) !== 0n,
      key: (raw & PTS_KEY) !== 0n,
      pts: raw & PTS_MASK,
      size: h.readUInt32BE(8),
    };
  }
}
