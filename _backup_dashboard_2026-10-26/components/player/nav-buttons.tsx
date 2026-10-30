"use client";

import {
  ControlType,
  KeyAction,
  Keycode,
  encodeBackOrScreenOn,
  encodeKeyPress,
  encodeSimple,
} from "@ce/shared/protocol";
import { Icons } from "./icons";

type Send = (m: Uint8Array) => void;

const BUTTONS: { key: string; title: string; icon: () => React.ReactElement; run: (send: Send) => void }[] = [
  {
    key: "back",
    title: "Back",
    icon: Icons.back,
    run: (s) => {
      s(encodeBackOrScreenOn(KeyAction.Down));
      s(encodeBackOrScreenOn(KeyAction.Up));
    },
  },
  { key: "home", title: "Home", icon: Icons.home, run: (s) => encodeKeyPress(Keycode.HOME).forEach(s) },
  { key: "recents", title: "Recent apps", icon: Icons.recents, run: (s) => encodeKeyPress(Keycode.APP_SWITCH).forEach(s) },
  { key: "volup", title: "Volume up", icon: Icons.volUp, run: (s) => encodeKeyPress(Keycode.VOLUME_UP).forEach(s) },
  { key: "voldown", title: "Volume down", icon: Icons.volDown, run: (s) => encodeKeyPress(Keycode.VOLUME_DOWN).forEach(s) },
  { key: "power", title: "Power (screen on/off)", icon: Icons.power, run: (s) => encodeKeyPress(Keycode.POWER).forEach(s) },
  { key: "rotate", title: "Rotate", icon: Icons.rotate, run: (s) => s(encodeSimple(ControlType.RotateDevice)) },
  {
    key: "notif",
    title: "Notifications",
    icon: Icons.notifications,
    run: (s) => s(encodeSimple(ControlType.ExpandNotificationPanel)),
  },
];

export function NavButtons({ send, disabled }: { send: Send; disabled: boolean }) {
  return (
    <aside className="player-side">
      {BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          className="icon-btn"
          title={b.title}
          aria-label={b.title}
          disabled={disabled}
          onClick={() => b.run(send)}
        >
          <b.icon />
        </button>
      ))}
    </aside>
  );
}
