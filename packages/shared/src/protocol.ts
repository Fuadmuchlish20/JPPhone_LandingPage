/**
 * Wire protocol between the browser player and the device-agent stream gateway,
 * plus encoders for the scrcpy control protocol (scrcpy server v3.x).
 * Browser-safe: no Node APIs.
 *
 * WebSocket subprotocols: client offers ["ce.v1", "token.<jwt>"], server selects "ce.v1".
 *
 * Server -> client
 *   binary: [channel u8][flags u8][pts i64 BE][payload...]
 *           channel 1 = video (H.264 Annex B), 2 = audio (Opus)
 *           flags bit0 = config packet, bit1 = key frame
 *   text:   JSON ServerMessage
 * Client -> server
 *   binary: exactly one scrcpy control message (encoded below)
 *   text:   JSON ClientMessage
 */

export const WS_SUBPROTOCOL = "ce.v1";
export const WS_TOKEN_PREFIX = "token.";

export const Channel = { Video: 1, Audio: 2 } as const;
export const FrameFlag = { Config: 1, Key: 2 } as const;
export const MEDIA_HEADER_SIZE = 10;

export const CloseCode = {
  Normal: 1000,
  Replaced: 4001, // device opened in another tab/session
  Unauthorized: 4003,
  DeviceUnavailable: 4004,
  StreamEnded: 4005,
  Internal: 4500,
} as const;

export type ServerMessage =
  | { type: "ready" }
  | { type: "video-meta"; codec: "h264"; width: number; height: number }
  | { type: "audio-meta"; codec: "opus" | "disabled" | "error" }
  | { type: "clipboard"; text: string }
  | { type: "pong"; t: number }
  | { type: "error"; message: string };

export type ClientMessage = { type: "ping"; t: number };

export interface MediaPacket {
  channel: number;
  config: boolean;
  key: boolean;
  pts: bigint;
  data: Uint8Array;
}

export function encodeMediaPacket(
  channel: number,
  config: boolean,
  key: boolean,
  pts: bigint,
  data: Uint8Array,
): Uint8Array {
  const out = new Uint8Array(MEDIA_HEADER_SIZE + data.byteLength);
  const dv = new DataView(out.buffer);
  dv.setUint8(0, channel);
  dv.setUint8(1, (config ? FrameFlag.Config : 0) | (key ? FrameFlag.Key : 0));
  dv.setBigInt64(2, pts);
  out.set(data, MEDIA_HEADER_SIZE);
  return out;
}

export function decodeMediaPacket(buf: ArrayBuffer): MediaPacket {
  const dv = new DataView(buf);
  const flags = dv.getUint8(1);
  return {
    channel: dv.getUint8(0),
    config: (flags & FrameFlag.Config) !== 0,
    key: (flags & FrameFlag.Key) !== 0,
    pts: dv.getBigInt64(2),
    data: new Uint8Array(buf, MEDIA_HEADER_SIZE),
  };
}

/* ------------------------------------------------------------------ */
/* scrcpy control protocol                                             */
/* ------------------------------------------------------------------ */

export const ControlType = {
  InjectKeycode: 0,
  InjectText: 1,
  InjectTouch: 2,
  InjectScroll: 3,
  BackOrScreenOn: 4,
  ExpandNotificationPanel: 5,
  ExpandSettingsPanel: 6,
  CollapsePanels: 7,
  GetClipboard: 8,
  SetClipboard: 9,
  SetDisplayPower: 10,
  RotateDevice: 11,
} as const;

/** Control message types the gateway will forward. UHID/app-start are blocked. */
export const ALLOWED_CONTROL_TYPES = new Set<number>(Object.values(ControlType));

export const KeyAction = { Down: 0, Up: 1 } as const;
export const MotionAction = { Down: 0, Up: 1, Move: 2, Cancel: 3 } as const;

/** scrcpy special pointer ids. */
export const POINTER_ID_MOUSE = -1n;
export const POINTER_ID_GENERIC_FINGER = -2n;

/** Android MotionEvent button state. */
export const MotionButton = { Primary: 1, Secondary: 2, Tertiary: 4 } as const;

/** Device -> client message types on the control socket. */
export const DeviceMessageType = { Clipboard: 0, AckClipboard: 1, UhidOutput: 2 } as const;

export const Keycode = {
  HOME: 3,
  BACK: 4,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  TAB: 61,
  SPACE: 62,
  ENTER: 66,
  DEL: 67,
  MENU: 82,
  PAGE_UP: 92,
  PAGE_DOWN: 93,
  ESCAPE: 111,
  FORWARD_DEL: 112,
  CTRL_LEFT: 113,
  MOVE_HOME: 122,
  MOVE_END: 123,
  APP_SWITCH: 187,
} as const;

export const MetaState = { Shift: 0x1, Alt: 0x2, Ctrl: 0x1000 } as const;

const textEncoder = new TextEncoder();
const MAX_TEXT_BYTES = 300;
const MAX_CLIPBOARD_BYTES = 256 * 1024;

function u16fp(v: number): number {
  // [0, 1] -> u16 fixed point
  const c = Math.min(1, Math.max(0, v));
  return c === 1 ? 0xffff : Math.round(c * 0x10000);
}

function i16fp(v: number): number {
  // [-1, 1] -> i16 fixed point
  const c = Math.min(1, Math.max(-1, v));
  const r = Math.round(c * 0x8000);
  return Math.max(-0x8000, Math.min(0x7fff, r));
}

export function encodeKeycode(action: number, keycode: number, repeat = 0, metaState = 0): Uint8Array {
  const b = new Uint8Array(14);
  const dv = new DataView(b.buffer);
  dv.setUint8(0, ControlType.InjectKeycode);
  dv.setUint8(1, action);
  dv.setUint32(2, keycode);
  dv.setUint32(6, repeat);
  dv.setUint32(10, metaState);
  return b;
}

export function encodeText(text: string): Uint8Array {
  let bytes = textEncoder.encode(text);
  if (bytes.byteLength > MAX_TEXT_BYTES) bytes = bytes.subarray(0, MAX_TEXT_BYTES);
  const b = new Uint8Array(5 + bytes.byteLength);
  const dv = new DataView(b.buffer);
  dv.setUint8(0, ControlType.InjectText);
  dv.setUint32(1, bytes.byteLength);
  b.set(bytes, 5);
  return b;
}

export interface TouchEventInput {
  action: number;
  pointerId: bigint;
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  pressure: number;
  actionButton?: number;
  buttons?: number;
}

export function encodeTouch(e: TouchEventInput): Uint8Array {
  const b = new Uint8Array(32);
  const dv = new DataView(b.buffer);
  dv.setUint8(0, ControlType.InjectTouch);
  dv.setUint8(1, e.action);
  dv.setBigInt64(2, e.pointerId);
  dv.setInt32(10, Math.round(e.x));
  dv.setInt32(14, Math.round(e.y));
  dv.setUint16(18, e.screenWidth);
  dv.setUint16(20, e.screenHeight);
  dv.setUint16(22, u16fp(e.pressure));
  dv.setUint32(24, e.actionButton ?? 0);
  dv.setUint32(28, e.buttons ?? 0);
  return b;
}

export interface ScrollEventInput {
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  /** scroll amount in "notches", clamped to [-16, 16] (scrcpy >= 3.3) */
  hScroll: number;
  vScroll: number;
  buttons?: number;
}

export function encodeScroll(e: ScrollEventInput): Uint8Array {
  const b = new Uint8Array(21);
  const dv = new DataView(b.buffer);
  dv.setUint8(0, ControlType.InjectScroll);
  dv.setInt32(1, Math.round(e.x));
  dv.setInt32(5, Math.round(e.y));
  dv.setUint16(9, e.screenWidth);
  dv.setUint16(11, e.screenHeight);
  dv.setInt16(13, i16fp(e.hScroll / 16));
  dv.setInt16(15, i16fp(e.vScroll / 16));
  dv.setUint32(17, e.buttons ?? 0);
  return b;
}

export function encodeBackOrScreenOn(action: number): Uint8Array {
  return Uint8Array.of(ControlType.BackOrScreenOn, action);
}

export function encodeSimple(type: 5 | 6 | 7 | 11): Uint8Array {
  return Uint8Array.of(type);
}

export function encodeGetClipboard(copyKey: 0 | 1 | 2 = 0): Uint8Array {
  return Uint8Array.of(ControlType.GetClipboard, copyKey);
}

export function encodeSetClipboard(text: string, paste: boolean, sequence = 0n): Uint8Array {
  let bytes = textEncoder.encode(text);
  if (bytes.byteLength > MAX_CLIPBOARD_BYTES) bytes = bytes.subarray(0, MAX_CLIPBOARD_BYTES);
  const b = new Uint8Array(14 + bytes.byteLength);
  const dv = new DataView(b.buffer);
  dv.setUint8(0, ControlType.SetClipboard);
  dv.setBigUint64(1, sequence);
  dv.setUint8(9, paste ? 1 : 0);
  dv.setUint32(10, bytes.byteLength);
  b.set(bytes, 14);
  return b;
}

/** Press + release a key. */
export function encodeKeyPress(keycode: number, metaState = 0): Uint8Array[] {
  return [
    encodeKeycode(KeyAction.Down, keycode, 0, metaState),
    encodeKeycode(KeyAction.Up, keycode, 0, metaState),
  ];
}
