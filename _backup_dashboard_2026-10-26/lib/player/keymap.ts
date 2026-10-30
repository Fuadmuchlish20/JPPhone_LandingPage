import { Keycode } from "@ce/shared/protocol";

/** KeyboardEvent.code → Android keycode for keys that are not plain text input. */
export const SPECIAL_KEYS: Record<string, number> = {
  Enter: Keycode.ENTER,
  NumpadEnter: Keycode.ENTER,
  Backspace: Keycode.DEL,
  Delete: Keycode.FORWARD_DEL,
  Tab: Keycode.TAB,
  Escape: Keycode.ESCAPE,
  ArrowUp: Keycode.DPAD_UP,
  ArrowDown: Keycode.DPAD_DOWN,
  ArrowLeft: Keycode.DPAD_LEFT,
  ArrowRight: Keycode.DPAD_RIGHT,
  Home: Keycode.MOVE_HOME,
  End: Keycode.MOVE_END,
  PageUp: Keycode.PAGE_UP,
  PageDown: Keycode.PAGE_DOWN,
};

/** KeyA..KeyZ → KEYCODE_A (29)..KEYCODE_Z (54), used for Ctrl+<letter> shortcuts. */
export function letterKeycode(code: string): number | null {
  const m = /^Key([A-Z])$/.exec(code);
  return m ? 29 + (m[1]!.charCodeAt(0) - 65) : null;
}
