/**
 * Browser input → scrcpy control messages.
 * Mouse: left = touch, right = BACK, middle = HOME. Touch/pen: true multi-touch.
 */
import {
  KeyAction,
  MetaState,
  MotionAction,
  POINTER_ID_GENERIC_FINGER,
  encodeBackOrScreenOn,
  encodeKeyPress,
  encodeKeycode,
  encodeScroll,
  encodeSetClipboard,
  encodeText,
  encodeTouch,
  Keycode,
} from "@ce/shared/protocol";
import { SPECIAL_KEYS, letterKeycode } from "./keymap";

export type Send = (msg: Uint8Array) => void;

export interface InputOptions {
  canvas: HTMLCanvasElement;
  /** element receiving keyboard focus (wraps the canvas) */
  focusTarget: HTMLElement;
  getFrameSize: () => { width: number; height: number };
  send: Send;
  onUserGesture?: () => void;
}

export function attachInput(o: InputOptions): () => void {
  const { canvas, focusTarget, getFrameSize, send } = o;
  const activePointers = new Set<number>();

  const toDevice = (e: { clientX: number; clientY: number }) => {
    const { width, height } = getFrameSize();
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    return {
      x: Math.max(0, Math.min(width - 1, x)),
      y: Math.max(0, Math.min(height - 1, y)),
      width,
      height,
    };
  };

  const pointerIdFor = (e: PointerEvent) =>
    e.pointerType === "mouse" ? POINTER_ID_GENERIC_FINGER : BigInt(e.pointerId);

  const sendTouch = (e: PointerEvent, action: number) => {
    const p = toDevice(e);
    if (!p.width || !p.height) return;
    send(
      encodeTouch({
        action,
        pointerId: pointerIdFor(e),
        x: p.x,
        y: p.y,
        screenWidth: p.width,
        screenHeight: p.height,
        pressure: action === MotionAction.Up ? 0 : e.pressure || 1,
      }),
    );
  };

  const onPointerDown = (e: PointerEvent) => {
    o.onUserGesture?.();
    focusTarget.focus({ preventScroll: true });
    if (e.pointerType === "mouse" && e.button === 2) {
      send(encodeBackOrScreenOn(KeyAction.Down));
      send(encodeBackOrScreenOn(KeyAction.Up));
      return;
    }
    if (e.pointerType === "mouse" && e.button === 1) {
      encodeKeyPress(Keycode.HOME).forEach(send);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    activePointers.add(e.pointerId);
    sendTouch(e, MotionAction.Down);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!activePointers.has(e.pointerId)) return;
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    if (events.length > 1) events.forEach((ce) => sendTouch(ce, MotionAction.Move));
    else sendTouch(e, MotionAction.Move);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!activePointers.delete(e.pointerId)) return;
    sendTouch(e, MotionAction.Up);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = toDevice(e);
    if (!p.width) return;
    const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 3 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 1 : 100;
    send(
      encodeScroll({
        x: p.x,
        y: p.y,
        screenWidth: p.width,
        screenHeight: p.height,
        hScroll: -e.deltaX / unit,
        vScroll: -e.deltaY / unit,
      }),
    );
  };

  const onContextMenu = (e: Event) => e.preventDefault();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const mod = e.ctrlKey || e.metaKey;

    // paste: browser clipboard → device clipboard, then paste
    if (mod && e.code === "KeyV") {
      e.preventDefault();
      navigator.clipboard
        ?.readText()
        .then((text) => text && send(encodeSetClipboard(text, true)))
        .catch(() => undefined);
      return;
    }
    const special = SPECIAL_KEYS[e.code];
    if (special !== undefined) {
      e.preventDefault();
      const meta = (e.shiftKey ? MetaState.Shift : 0) | (mod ? MetaState.Ctrl : 0) | (e.altKey ? MetaState.Alt : 0);
      send(encodeKeycode(KeyAction.Down, special, e.repeat ? 1 : 0, meta));
      return;
    }
    if (mod) {
      const kc = letterKeycode(e.code);
      if (kc !== null) {
        e.preventDefault();
        encodeKeyPress(kc, MetaState.Ctrl).forEach(send);
      }
      return;
    }
    if (e.key.length === 1 && !e.altKey) {
      e.preventDefault();
      send(encodeText(e.key));
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const special = SPECIAL_KEYS[e.code];
    if (special === undefined) return;
    e.preventDefault();
    send(encodeKeycode(KeyAction.Up, special));
  };

  const onCompositionEnd = (e: CompositionEvent) => {
    if (e.data) send(encodeText(e.data));
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);
  focusTarget.addEventListener("keydown", onKeyDown);
  focusTarget.addEventListener("keyup", onKeyUp);
  focusTarget.addEventListener("compositionend", onCompositionEnd);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("contextmenu", onContextMenu);
    focusTarget.removeEventListener("keydown", onKeyDown);
    focusTarget.removeEventListener("keyup", onKeyUp);
    focusTarget.removeEventListener("compositionend", onCompositionEnd);
  };
}
